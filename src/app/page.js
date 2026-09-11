// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [user, setUser] = useState(null);
  const [mySessions, setMySessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [activeAccordionId, setActiveAccordionId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    console.log('URL defined?:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('KEY defined?:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    fetchSessions(user);
  }

  async function fetchSessions(currentUser) {
    const nowIso = new Date().toISOString();

    // Fetch all upcoming sessions with joined player profiles
    const { data: sessionsData, error } = await supabase
      .from('sessions')
      .select('*, registrations(id, user_id, profiles(full_name, avatar_url))')
      .gte('iso_timestamp', nowIso)
      .order('iso_timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error.message);
      return;
    }

    if (sessionsData) {
      setAllSessions(sessionsData);

      // Filter sessions the logged-in user joined
      if (currentUser) {
        const userJoined = sessionsData.filter((session) =>
          session.registrations?.some((reg) => reg.user_id === currentUser.id)
        );
        setMySessions(userJoined);
      } else {
        setMySessions([]);
      }
    }
  }

  const handleJoin = async (sessionId, courseName, datetime) => {
    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Insert registration into Supabase
    const { error } = await supabase
      .from('registrations')
      .insert([{ session_id: sessionId, user_id: user.id }]);

    if (!error) {
      fetchSessions(user);

      // 2. Query the user's profile from the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .single();

      // 3. Trigger SMS if a phone number exists
      if (profile?.phone_number) {
        await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: profile.phone_number,
            body: `⛳ Golf Feed: You're confirmed for ${courseName} on ${datetime}!`,
          }),
        });
      }
    } else {
      alert('Could not join session or already registered.');
    }
  };

  const handleLeave = async (sessionId) => {
    if (!user) return;

    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', user.id);

    if (!error) {
      fetchSessions(user);
    } else {
      alert('Failed to leave session.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMySessions([]);
    fetchSessions(null);
  };

  const toggleAccordion = (id) => {
    setActiveAccordionId((prev) => (prev === id ? null : id));
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* TOP BAR */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Golf Feed</h1>
            <p className="text-xs text-slate-400">Coordinate tee times & range sessions</p>
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <a
                  href="/dashboard"
                  className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-semibold hover:bg-emerald-500/20 transition"
                >
                  Host Dashboard
                </a>
                <button
                  onClick={handleSignOut}
                  className="text-xs text-slate-400 hover:text-rose-400 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="text-xs bg-emerald-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl hover:bg-emerald-400 transition"
              >
                Sign In / Register
              </a>
            )}
          </div>
        </header>

        {/* MY UPCOMING ROUNDS (LOGGED IN USER) */}
        {user && mySessions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              ⛳ My Signed Up Rounds
            </h2>
            <div className="space-y-3">
              {mySessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-4 flex justify-between items-center"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-400">{session.datetime}</span>
                    <h3 className="text-base font-bold text-white">{session.course}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-semibold">
                      Spot Confirmed
                    </span>
                    <button
                      onClick={() => handleLeave(session.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ALL UPCOMING ROUNDS */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            All Upcoming Sessions
          </h2>
          <div className="space-y-4">
            {allSessions.map((session) => {
              const registeredCount = session.registrations?.length || 0;
              const openSpots = session.max_spots - registeredCount;
              const isJoined = session.registrations?.some((r) => r.user_id === user?.id);
              const isExpanded = activeAccordionId === session.id;

              return (
                <div
                  key={session.id}
                  className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl"
                >
                  <div className="p-5 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">{session.datetime}</span>
                      <h3 className="text-lg font-bold text-white">{session.course}</h3>
                      <p className="text-xs text-slate-400">{session.subtitle}</p>
                    </div>

                    <div className="text-right space-y-2">
                      <span className="text-xs text-slate-400 font-medium block">
                        {openSpots > 0 ? `${openSpots} spots left` : 'Full'}
                      </span>
                      {isJoined ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-semibold">
                            Joined
                          </span>
                          <button
                            onClick={() => handleLeave(session.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoin(session.id, session.course, session.datetime)}
                          disabled={openSpots <= 0}
                          className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl transition disabled:opacity-50"
                        >
                          Join Round
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ACCORDION ROSTER TOGGLE */}
                  <div className="bg-slate-800/50 border-t border-slate-700/60 px-5 py-2.5 flex justify-between items-center">
                    <button
                      onClick={() => toggleAccordion(session.id)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition font-medium flex items-center gap-1.5"
                    >
                      <span>👥 Registered Roster ({registeredCount} / {session.max_spots})</span>
                      <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                    </button>
                  </div>

                  {/* EXPANDABLE ROSTER DETAILS */}
                  {isExpanded && (
                    <div className="bg-slate-900/60 p-4 border-t border-slate-700/40 space-y-2">
                      {registeredCount === 0 ? (
                        <p className="text-xs text-slate-500 italic">No golfers registered yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {session.registrations.map((reg) => (
                            <span
                              key={reg.id || reg.user_id}
                              className="text-xs bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5"
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              {reg.profiles?.full_name || 'Anonymous Golfer'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
