import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench, Hammer, LayoutDashboard, Phone, MapPin, User, CheckCircle2,
  Clock, XCircle, ClipboardList, Search, Plus, Loader2, AlertCircle,
  Users, TrendingUp, ChevronRight
} from 'lucide-react';
import { db } from './firebase.js';
import {
  collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy
} from 'firebase/firestore';

const METIERS = [
  'Plomberie', 'Électricité', 'Maçonnerie', 'Menuiserie', 'Peinture',
  'Carrelage', 'Soudure', 'Climatisation', 'Vitrerie', 'Autre'
];

const STATUTS = ['Nouvelle', 'Acceptée', 'Terminée', 'Annulée'];

const STATUT_STYLE = {
  'Nouvelle':  { bg: '#3A2F12', text: '#E8B23B', dot: '#E8B23B' },
  'Acceptée':  { bg: '#0F2E2E', text: '#3FB8B8', dot: '#3FB8B8' },
  'Terminée':  { bg: '#1F2A12', text: '#9BB24D', dot: '#9BB24D' },
  'Annulée':   { bg: '#33150F', text: '#D9633F', dot: '#D9633F' },
};

function genId(prefix) {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${n}`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const StripeBar = ({ className = '' }) => (
  <div
    className={className}
    style={{
      height: 6,
      backgroundImage: 'repeating-linear-gradient(135deg, #E8590C 0 14px, #1B1A17 14px 28px)',
    }}
  />
);

const StencilBadge = ({ id }) => (
  <span
    style={{
      fontFamily: "'Oswald', sans-serif",
      letterSpacing: '0.08em',
      border: '2px solid #E8590C',
      color: '#E8590C',
      transform: 'rotate(-2deg)',
    }}
    className="inline-block px-2 py-0.5 text-xs font-semibold uppercase"
  >
    N° {id}
  </span>
);

const StatusPill = ({ status }) => {
  const s = STATUT_STYLE[status] || STATUT_STYLE['Nouvelle'];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold uppercase tracking-wide"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {status}
    </span>
  );
};

const Field = ({ label, children, required }) => (
  <label className="block mb-3">
    <span className="block text-xs uppercase tracking-wide mb-1" style={{ color: '#A39C8F' }}>
      {label}{required && <span style={{ color: '#E8590C' }}> *</span>}
    </span>
    {children}
  </label>
);

const inputStyle = {
  backgroundColor: '#1F1D1A',
  border: '1px solid #3A3631',
  color: '#F2EFEA',
};

export default function ProBricolagePN() {
  const [view, setView] = useState('client');
  const [demandes, setDemandes] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let demandesLoaded = false;
    let artisansLoaded = false;
    const checkLoaded = () => {
      if (demandesLoaded && artisansLoaded) setLoading(false);
    };

    const qDemandes = query(collection(db, 'demandes'), orderBy('date', 'desc'));
    const unsubDemandes = onSnapshot(
      qDemandes,
      (snap) => {
        setDemandes(snap.docs.map(d => ({ ...d.data(), firestoreId: d.id })));
        demandesLoaded = true;
        checkLoaded();
      },
      (e) => {
        setError("Impossible de charger les demandes. Vérifie ta connexion.");
        demandesLoaded = true;
        checkLoaded();
      }
    );

    const qArtisans = query(collection(db, 'artisans'), orderBy('date', 'desc'));
    const unsubArtisans = onSnapshot(
      qArtisans,
      (snap) => {
        setArtisans(snap.docs.map(d => ({ ...d.data(), firestoreId: d.id })));
        artisansLoaded = true;
        checkLoaded();
      },
      (e) => {
        setError("Impossible de charger les artisans. Vérifie ta connexion.");
        artisansLoaded = true;
        checkLoaded();
      }
    );

    return () => {
      unsubDemandes();
      unsubArtisans();
    };
  }, []);

  async function addDemande(newDemande) {
    try {
      await addDoc(collection(db, 'demandes'), newDemande);
    } catch (e) {
      setError("L'envoi de la demande a échoué. Vérifie ta connexion et réessaie.");
    }
  }

  async function updateDemande(firestoreId, changes) {
    try {
      await updateDoc(doc(db, 'demandes', firestoreId), changes);
    } catch (e) {
      setError("La mise à jour a échoué. Vérifie ta connexion et réessaie.");
    }
  }

  async function addArtisan(newArtisan) {
    try {
      await addDoc(collection(db, 'artisans'), newArtisan);
    } catch (e) {
      setError("L'inscription a échoué. Vérifie ta connexion et réessaie.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1B1A17' }}>
        <Loader2 className="animate-spin" size={28} color="#E8590C" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1B1A17', color: '#F2EFEA', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        ::selection { background: #E8590C; color: #1B1A17; }
      `}</style>

      <header className="px-5 pt-8 pb-0 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2" style={{ backgroundColor: '#E8590C' }}>
            <Wrench size={20} color="#1B1A17" strokeWidth={2.5} />
          </div>
          <div>
            <h1
              style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.02em' }}
              className="text-2xl font-semibold uppercase leading-none"
            >
              Pro Bricolage PN
            </h1>
            <p className="text-sm mt-1" style={{ color: '#A39C8F' }}>
              L'intermédiaire entre vous et les meilleurs artisans de Pointe-Noire
            </p>
          </div>
        </div>
      </header>
      <StripeBar className="mt-6" />

      <nav className="max-w-5xl mx-auto px-5 flex gap-1 mt-5">
        {[
          { key: 'client', label: 'Client', icon: ClipboardList },
          { key: 'artisan', label: 'Artisan', icon: Hammer },
          { key: 'admin', label: 'Petros', icon: LayoutDashboard },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors"
            style={{
              backgroundColor: view === key ? '#E8590C' : '#242220',
              color: view === key ? '#1B1A17' : '#A39C8F',
              fontFamily: "'Oswald', sans-serif",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <main className="max-w-5xl mx-auto px-5 py-6">
        {error && (
          <div className="mb-5 px-4 py-3 flex items-center gap-2 text-sm" style={{ backgroundColor: '#33150F', color: '#D9633F' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {view === 'client' && <ClientView demandes={demandes} addDemande={addDemande} />}
        {view === 'artisan' && (
          <ArtisanView
            demandes={demandes}
            artisans={artisans}
            updateDemande={updateDemande}
            addArtisan={addArtisan}
          />
        )}
        {view === 'admin' && <AdminView demandes={demandes} artisans={artisans} updateDemande={updateDemande} />}
      </main>
    </div>
  );
}

// ---------- CLIENT ----------
function ClientView({ demandes, addDemande }) {
  const [form, setForm] = useState({ nom: '', telephone: '', metier: METIERS[0], quartier: '', description: '' });
  const [confirmation, setConfirmation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const myDemandes = useMemo(() => {
    if (!searchPhone.trim()) return [];
    return demandes
      .filter(d => d.telephone.replace(/\s/g, '').includes(searchPhone.replace(/\s/g, '')))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [demandes, searchPhone]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom.trim() || !form.telephone.trim() || !form.description.trim()) return;
    setSubmitting(true);
    const newDemande = {
      id: genId('D'),
      nom: form.nom.trim(),
      telephone: form.telephone.trim(),
      metier: form.metier,
      quartier: form.quartier.trim() || 'Non précisé',
      description: form.description.trim(),
      date: new Date().toISOString(),
      status: 'Nouvelle',
      artisan: null,
    };
    await addDemande(newDemande);
    setConfirmation(newDemande);
    setForm({ nom: '', telephone: '', metier: METIERS[0], quartier: '', description: '' });
    setSubmitting(false);
  }

  if (confirmation) {
    return (
      <div className="max-w-md">
        <div className="p-6" style={{ backgroundColor: '#242220', border: '1px solid #3A3631' }}>
          <CheckCircle2 size={28} color="#9BB24D" />
          <h2 className="text-lg font-semibold mt-3 mb-1">Demande enregistrée</h2>
          <p className="text-sm mb-4" style={{ color: '#A39C8F' }}>
            Un artisan {confirmation.metier.toLowerCase()} va prendre contact avec vous au {confirmation.telephone}.
          </p>
          <StencilBadge id={confirmation.id} />
          <button
            onClick={() => setConfirmation(null)}
            className="block mt-5 text-sm font-semibold uppercase tracking-wide px-4 py-2"
            style={{ backgroundColor: '#E8590C', color: '#1B1A17', fontFamily: "'Oswald', sans-serif" }}
          >
            Faire une autre demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 style={{ fontFamily: "'Oswald', sans-serif" }} className="text-lg font-semibold uppercase mb-4">
          Demander un artisan
        </h2>
        <form onSubmit={handleSubmit}>
          <Field label="Votre nom" required>
            <input
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle}
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex : Jean Mavoungou"
            />
          </Field>
          <Field label="Téléphone" required>
            <input
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle}
              value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
              placeholder="06 XXX XX XX"
            />
          </Field>
          <Field label="Métier recherché" required>
            <select
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle}
              value={form.metier}
              onChange={e => setForm({ ...form, metier: e.target.value })}
            >
              {METIERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Quartier">
            <input
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle}
              value={form.quartier}
              onChange={e => setForm({ ...form, quartier: e.target.value })}
              placeholder="Ex : Tié-Tié, Loandjili..."
            />
          </Field>
          <Field label="Décrivez le problème" required>
            <textarea
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={{ ...inputStyle, minHeight: 90 }}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Ex : Fuite d'eau sous l'évier de la cuisine"
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide"
            style={{ backgroundColor: '#E8590C', color: '#1B1A17', fontFamily: "'Oswald', sans-serif" }}
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Envoyer ma demande
          </button>
        </form>
      </div>

      <div>
        <button
          onClick={() => setShowSearch(s => !s)}
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide mb-4"
          style={{ color: '#A39C8F', fontFamily: "'Oswald', sans-serif" }}
        >
          <Search size={15} />
          Suivre une demande existante
          <ChevronRight size={14} style={{ transform: showSearch ? 'rotate(90deg)' : 'none' }} />
        </button>
        {showSearch && (
          <div>
            <input
              className="w-full px-3 py-2 text-sm mb-4 focus:outline-none"
              style={inputStyle}
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
              placeholder="Entrez votre numéro de téléphone"
            />
            {searchPhone.trim() && myDemandes.length === 0 && (
              <p className="text-sm" style={{ color: '#A39C8F' }}>Aucune demande trouvée pour ce numéro.</p>
            )}
            <div className="space-y-3">
              {myDemandes.map(d => (
                <div key={d.firestoreId} className="p-3" style={{ backgroundColor: '#242220', border: '1px solid #3A3631' }}>
                  <div className="flex items-center justify-between mb-2">
                    <StencilBadge id={d.id} />
                    <StatusPill status={d.status} />
                  </div>
                  <p className="text-sm font-medium">{d.metier} · {d.quartier}</p>
                  <p className="text-xs mt-1" style={{ color: '#A39C8F' }}>{d.description}</p>
                  {d.artisan && (
                    <p className="text-xs mt-2" style={{ color: '#3FB8B8' }}>
                      Artisan assigné : {d.artisan.nom} · {d.artisan.telephone}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- ARTISAN ----------
function ArtisanView({ demandes, artisans, updateDemande, addArtisan }) {
  const [tab, setTab] = useState('demandes');
  const [metierFiltre, setMetierFiltre] = useState('Tous');
  const [acceptingId, setAcceptingId] = useState(null);
  const [acceptForm, setAcceptForm] = useState({ nom: '', telephone: '' });
  const [regForm, setRegForm] = useState({ nom: '', telephone: '', metier: METIERS[0], quartier: '' });
  const [registered, setRegistered] = useState(false);

  const ouvertes = useMemo(() => {
    return demandes
      .filter(d => d.status === 'Nouvelle')
      .filter(d => metierFiltre === 'Tous' || d.metier === metierFiltre)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [demandes, metierFiltre]);

  async function handleAccept(d) {
    if (!acceptForm.nom.trim() || !acceptForm.telephone.trim()) return;
    await updateDemande(d.firestoreId, {
      status: 'Acceptée',
      artisan: { nom: acceptForm.nom.trim(), telephone: acceptForm.telephone.trim() },
    });
    setAcceptingId(null);
    setAcceptForm({ nom: '', telephone: '' });
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!regForm.nom.trim() || !regForm.telephone.trim()) return;
    const newArtisan = { id: genId('A'), ...regForm, nom: regForm.nom.trim(), telephone: regForm.telephone.trim(), date: new Date().toISOString() };
    await addArtisan(newArtisan);
    setRegistered(true);
    setRegForm({ nom: '', telephone: '', metier: METIERS[0], quartier: '' });
  }

  return (
    <div>
      <div className="flex gap-1 mb-6">
        {[{ key: 'demandes', label: 'Demandes disponibles' }, { key: 'inscription', label: "S'inscrire" }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: tab === t.key ? '#3A3631' : 'transparent',
              color: tab === t.key ? '#F2EFEA' : '#A39C8F',
              fontFamily: "'Oswald', sans-serif",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'demandes' && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xs uppercase tracking-wide" style={{ color: '#A39C8F' }}>Filtrer par métier</span>
            <select
              className="px-3 py-1.5 text-sm focus:outline-none"
              style={inputStyle}
              value={metierFiltre}
              onChange={e => setMetierFiltre(e.target.value)}
            >
              <option value="Tous">Tous les métiers</option>
              {METIERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {ouvertes.length === 0 && (
            <p className="text-sm" style={{ color: '#A39C8F' }}>Aucune demande ouverte pour le moment.</p>
          )}

          <div className="space-y-3">
            {ouvertes.map(d => (
              <div key={d.firestoreId} className="p-4" style={{ backgroundColor: '#242220', border: '1px solid #3A3631' }}>
                <div className="flex items-center justify-between mb-2">
                  <StencilBadge id={d.id} />
                  <span className="text-xs" style={{ color: '#A39C8F' }}>{fmtDate(d.date)}</span>
                </div>
                <p className="font-semibold text-sm">{d.metier}</p>
                <p className="text-sm mt-1" style={{ color: '#D6D0C4' }}>{d.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: '#A39C8F' }}>
                  <span className="flex items-center gap-1"><MapPin size={12} />{d.quartier}</span>
                  <span className="flex items-center gap-1"><User size={12} />{d.nom}</span>
                </div>

                {acceptingId === d.id ? (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid #3A3631' }}>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        className="px-2 py-1.5 text-sm focus:outline-none"
                        style={inputStyle}
                        placeholder="Votre nom"
                        value={acceptForm.nom}
                        onChange={e => setAcceptForm({ ...acceptForm, nom: e.target.value })}
                      />
                      <input
                        className="px-2 py-1.5 text-sm focus:outline-none"
                        style={inputStyle}
                        placeholder="Votre téléphone"
                        value={acceptForm.telephone}
                        onChange={e => setAcceptForm({ ...acceptForm, telephone: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(d)}
                        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: '#E8590C', color: '#1B1A17', fontFamily: "'Oswald', sans-serif" }}
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setAcceptingId(null)}
                        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: '#A39C8F' }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAcceptingId(d.id)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide px-3 py-1.5"
                    style={{ backgroundColor: '#0F2E2E', color: '#3FB8B8', fontFamily: "'Oswald', sans-serif" }}
                  >
                    <Hammer size={13} />
                    Je m'en occupe
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'inscription' && (
        <div className="max-w-md">
          {registered ? (
            <div className="p-6" style={{ backgroundColor: '#242220', border: '1px solid #3A3631' }}>
              <CheckCircle2 size={24} color="#9BB24D" />
              <p className="text-sm mt-3 mb-3">Inscription enregistrée. Tu peux maintenant voir les demandes correspondant à ton métier.</p>
              <button
                onClick={() => { setRegistered(false); setTab('demandes'); }}
                className="text-xs font-semibold uppercase tracking-wide px-3 py-1.5"
                style={{ backgroundColor: '#E8590C', color: '#1B1A17', fontFamily: "'Oswald', sans-serif" }}
              >
                Voir les demandes
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister}>
              <Field label="Nom" required>
                <input className="w-full px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={regForm.nom} onChange={e => setRegForm({ ...regForm, nom: e.target.value })} />
              </Field>
              <Field label="Téléphone" required>
                <input className="w-full px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={regForm.telephone} onChange={e => setRegForm({ ...regForm, telephone: e.target.value })} />
              </Field>
              <Field label="Métier" required>
                <select className="w-full px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={regForm.metier} onChange={e => setRegForm({ ...regForm, metier: e.target.value })}>
                  {METIERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Quartier">
                <input className="w-full px-3 py-2 text-sm focus:outline-none" style={inputStyle}
                  value={regForm.quartier} onChange={e => setRegForm({ ...regForm, quartier: e.target.value })} />
              </Field>
              <button type="submit" className="mt-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide"
                style={{ backgroundColor: '#E8590C', color: '#1B1A17', fontFamily: "'Oswald', sans-serif" }}>
                S'inscrire comme artisan
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- ADMIN (PETROS) ----------
function AdminView({ demandes, artisans, updateDemande }) {
  const [statusFiltre, setStatusFiltre] = useState('Toutes');

  const stats = useMemo(() => {
    const total = demandes.length;
    const parStatut = STATUTS.reduce((acc, s) => {
      acc[s] = demandes.filter(d => d.status === s).length;
      return acc;
    }, {});
    return { total, parStatut, totalArtisans: artisans.length };
  }, [demandes, artisans]);

  const liste = useMemo(() => {
    return demandes
      .filter(d => statusFiltre === 'Toutes' || d.status === statusFiltre)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [demandes, statusFiltre]);

  async function changeStatus(firestoreId, newStatus) {
    await updateDemande(firestoreId, { status: newStatus });
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <StatCard icon={TrendingUp} label="Total" value={stats.total} />
        <StatCard icon={Clock} label="Nouvelles" value={stats.parStatut['Nouvelle']} color="#E8B23B" />
        <StatCard icon={Hammer} label="Acceptées" value={stats.parStatut['Acceptée']} color="#3FB8B8" />
        <StatCard icon={CheckCircle2} label="Terminées" value={stats.parStatut['Terminée']} color="#9BB24D" />
        <StatCard icon={Users} label="Artisans" value={stats.totalArtisans} color="#E8590C" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontFamily: "'Oswald', sans-serif" }} className="text-lg font-semibold uppercase">Toutes les demandes</h2>
        <select
          className="px-3 py-1.5 text-sm focus:outline-none"
          style={inputStyle}
          value={statusFiltre}
          onChange={e => setStatusFiltre(e.target.value)}
        >
          <option value="Toutes">Tous les statuts</option>
          {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {liste.length === 0 && <p className="text-sm mb-8" style={{ color: '#A39C8F' }}>Aucune demande à afficher.</p>}

      <div className="space-y-3 mb-10">
        {liste.map(d => (
          <div key={d.firestoreId} className="p-4" style={{ backgroundColor: '#242220', border: '1px solid #3A3631' }}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-3">
                <StencilBadge id={d.id} />
                <span className="text-xs" style={{ color: '#A39C8F' }}>{fmtDate(d.date)}</span>
              </div>
              <select
                value={d.status}
                onChange={e => changeStatus(d.firestoreId, e.target.value)}
                className="text-xs font-semibold uppercase tracking-wide px-2 py-1 focus:outline-none"
                style={{ ...inputStyle, color: STATUT_STYLE[d.status].text }}
              >
                {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <p className="text-sm font-semibold">{d.metier} · {d.nom}</p>
            <p className="text-sm" style={{ color: '#D6D0C4' }}>{d.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs" style={{ color: '#A39C8F' }}>
              <span className="flex items-center gap-1"><Phone size={12} />{d.telephone}</span>
              <span className="flex items-center gap-1"><MapPin size={12} />{d.quartier}</span>
              {d.artisan && <span style={{ color: '#3FB8B8' }}>Artisan : {d.artisan.nom} ({d.artisan.telephone})</span>}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: "'Oswald', sans-serif" }} className="text-lg font-semibold uppercase mb-4">Artisans inscrits</h2>
      {artisans.length === 0 && <p className="text-sm" style={{ color: '#A39C8F' }}>Aucun artisan inscrit pour le moment.</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        {artisans.map(a => (
          <div key={a.firestoreId} className="p-3 flex items-center justify-between" style={{ backgroundColor: '#242220', border: '1px solid #3A3631' }}>
            <div>
              <p className="text-sm font-semibold">{a.nom}</p>
              <p className="text-xs" style={{ color: '#A39C8F' }}>{a.metier} · {a.quartier || 'Non précisé'}</p>
            </div>
            <span className="text-xs" style={{ color: '#A39C8F' }}>{a.telephone}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = '#F2EFEA' }) {
  return (
    <div className="p-3" style={{ backgroundColor: '#242220', border: '1px solid #3A3631' }}>
      <Icon size={16} color={color} />
      <p style={{ fontFamily: "'Oswald', sans-serif", color }} className="text-2xl font-semibold mt-1.5 leading-none">
        {value || 0}
      </p>
      <p className="text-xs mt-1 uppercase tracking-wide" style={{ color: '#A39C8F' }}>{label}</p>
    </div>
  );
}
