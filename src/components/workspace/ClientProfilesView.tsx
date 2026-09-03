'use client';

import { useState, type FormEvent } from 'react';

import type { Locale } from '../../lib/i18n';
import {
  WORKSPACE_KEYS,
  createClientProfile,
  parseClientProfiles,
  removeClientProfile,
  updateClientProfile,
  type ClientProfileInput,
} from '../../lib/workspace';
import { workspaceCopy } from '../../lib/workspace/copy';
import { useWorkspaceCollection } from './useWorkspaceCollection';

const EMPTY_INPUT: ClientProfileInput = {
  name: '', businessDescription: '', brandColors: '', tone: '', constraints: '', notes: '',
};

export function ClientProfilesView({ locale }: { locale: Locale }) {
  const copy = workspaceCopy[locale];
  const [profiles, setProfiles] = useWorkspaceCollection({
    key: WORKSPACE_KEYS.clients,
    parse: parseClientProfiles,
    serialize: JSON.stringify,
    empty: [],
  });
  const [form, setForm] = useState<ClientProfileInput>(EMPTY_INPUT);
  const [editingId, setEditingId] = useState('');

  const set = (field: keyof ClientProfileInput, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const reset = () => { setForm(EMPTY_INPUT); setEditingId(''); };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      setProfiles(updateClientProfile(profiles, editingId, form, now));
    } else {
      setProfiles([...profiles, createClientProfile(form, now, crypto.randomUUID())]);
    }
    reset();
  };

  const edit = (id: string) => {
    const profile = profiles.find((item) => item.id === id);
    if (!profile) return;
    setEditingId(id);
    setForm({
      name: profile.name,
      businessDescription: profile.businessDescription,
      brandColors: profile.brandColors,
      tone: profile.tone,
      constraints: profile.constraints,
      notes: profile.notes,
    });
  };

  const remove = (id: string) => {
    if (!window.confirm(copy.confirmDeleteProfile)) return;
    setProfiles(removeClientProfile(profiles, id));
    if (editingId === id) reset();
  };

  return (
    <div className="client-profiles-view">
      <form className="client-profile-form" onSubmit={submit}>
        <label>{copy.clientName}<input required value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label>{copy.businessDescription}<textarea rows={3} value={form.businessDescription} onChange={(e) => set('businessDescription', e.target.value)} /></label>
        <label>{copy.brandColors}<input value={form.brandColors} onChange={(e) => set('brandColors', e.target.value)} /></label>
        <label>{copy.tone}<input value={form.tone} onChange={(e) => set('tone', e.target.value)} /></label>
        <label>{copy.constraints}<textarea rows={3} value={form.constraints} onChange={(e) => set('constraints', e.target.value)} /></label>
        <label>{copy.clientNotes}<textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></label>
        <div className="client-profile-form__actions">
          <button type="submit">{editingId ? copy.saveChanges : copy.saveProfile}</button>
          {editingId ? <button type="button" onClick={reset}>{copy.cancelEdit}</button> : null}
        </div>
      </form>

      <div className="client-profile-list">
        {profiles.length === 0 ? <p className="workspace-status">{copy.emptyClients}</p> : profiles.map((profile) => (
          <article className="client-profile-card" key={profile.id}>
            <div><h2>{profile.name}</h2>{profile.businessDescription ? <p>{profile.businessDescription}</p> : null}</div>
            <div className="client-profile-card__actions">
              <button type="button" onClick={() => edit(profile.id)}>{copy.editProfile} {profile.name}</button>
              <button type="button" onClick={() => remove(profile.id)}>{copy.deleteProfile} {profile.name}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
