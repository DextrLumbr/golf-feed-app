// src/app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Event Form State
  const [course, setCourse] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState('Round');
  const [eventDate, setEventDate] = useState(''); // e.g., 2026-09-15T08:30
  const [costPerPlayer, setCostPerPlayer] = useState('45');
  const [maxSpots, setMaxSpots] = useState('4');

  useEffect(() => {
    console.log('URL defined?:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('KEY defined?:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    fetchAdminSessions();
  }, []);

  async function fetchAdminSessions() {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, registrations(id, user_id, profiles(full_name, avatar_url))')
      .order('iso_timestamp', { ascending: true });

    if (!error && data) {
      setSessions(data);
    } else if (error) {
      console.error('Error fetching admin sessions:', error.message);
    }
  }

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!course || !eventDate) return;

    setLoading(true);

    const isoDate = new Date(eventDate);
    const isoString = isoDate.toISOString();

    // Format human readable date: e.g., "Sat, Sep 12 @ 8:30 AM"
    const displayDate =
      isoDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) +
      ' @ ' +
      isoDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const newSession = {
      course,
      subtitle,
      type,
      datetime: displayDate,
      iso_timestamp: isoString,
      cost_per_player: parseFloat(costPerPlayer),
      max_spots: parseInt(maxSpots, 10),
      host_id: user?.id,
    };

    const { error } = await supabase.from('sessions').insert([newSession]);

    if (!error) {
      setCourse('');
      setSubtitle('');
      setEventDate('');
      fetchAdminSessions();
    } else {
      alert('Error creating session');
      console.error(error);
    }
    setLoading(false);
  };

  const handleRemoveRegistration = async (registrationId) => {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', registrationId);

    if (!error) {
      fetchAdminSessions();
    } else {
      alert('Failed to remove player.');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const { error } = await supabase.from('sessions').delete().eq('id', sessionId);

    if (!error) {
      fetchAdminSessions();
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Host Admin Dashboard</h1>
            <p className="text-xs text-slate-400">Manage upcoming golf events and rosters</p>
          </div>
          <a
            href="/"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition"
          >
            View Public Page &rarr;
          </a>
        </header>

        {/* CREATE EVENT FORM */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Create New Event</h2>
          <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Course / Venue</label>
              <input
                type="text"
                required
                placeholder="e.g. Stoneybrook West"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Subtitle / Format</label>
              <input
                type="text"
                placeholder="e.g. 18 Holes - Morning Tee Time"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Event Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Round">Round</option>
                <option value="Range">Range Session</option>
                <option value="Tournament">Tournament</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Date & Time</label>
              <input
                type="datetime-local"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Cost Per Player ($)</label>
              <input
                type="number"
                required
                value={costPerPlayer}
                onChange={(e) => setCostPerPlayer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Max Spots</label>
              <input
                type="number"
                required
                value={maxSpots}
                onChange={(e) => setMaxSpots(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition text-sm cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Publish Event'}
              </button>
            </div>
          </form>
        </section>

        {/* EXISTING EVENTS MANAGER */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">All Events & Rosters</h2>
          <div className="space-y-4">
            {sessions.map((session) => {
              const registrations = session.registrations || [];

              return (
                <div key={session.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-700/80 pb-3">
                    <div>
                      <span className="text-xs text-emerald-400 font-semibold">{session.type}</span>
                      <h3 className="text-lg font-bold text-white">{session.course}</h3>
                      <p className="text-xs text-slate-400">{session.datetime}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-xs text-rose-400 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition"
                    >
                      Delete Event
                    </button>
                  </div>

                  {/* ROSTER TABLE */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Roster ({registrations.length} / {session.max_spots})
                    </h4>
                    {registrations.length > 0 ? (
                      <div className="space-y-2">
                        {registrations.map((reg) => (
                          <div
                            key={reg.id}
                            className="flex items-center justify-between bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-700/40 text-sm"
                          >
                            <div>
                              <span className="font-medium text-slate-200">
                                {reg.profiles?.full_name || 'Golfer'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveRegistration(reg.id)}
                              className="text-xs text-slate-400 hover:text-rose-400 transition"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No players signed up yet.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
