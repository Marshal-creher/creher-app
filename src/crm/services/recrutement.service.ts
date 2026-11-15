import api from '../lib/axios'

export interface Offre {
  id: number
  titre: string
  departement_id: number | null
  departement_name: string | null
  description: string | null
  type_contrat: 'CDI' | 'CDD' | 'INTERIM' | 'STAGE' | 'FREELANCE'
  nb_postes: number
  statut: 'OUVERT' | 'EN_PAUSE' | 'FERME'
  date_limite: string | null
  nb_candidatures: number
  created_at: string
}

export interface Candidature {
  id: number
  offre_id: number | null
  offre_titre: string | null
  nom: string
  prenom: string
  email: string | null
  telephone: string | null
  poste_souhaite: string | null
  cv_url: string | null
  lettre_url: string | null
  statut: 'NOUVEAU' | 'PRESELECTION' | 'ENTRETIEN_PLANIFIE' | 'ENTRETIEN_FAIT' | 'OFFRE_ENVOYEE' | 'RECRUTE' | 'REJETE'
  source: 'SITE_WEB' | 'LINKEDIN' | 'REFERRAL' | 'SPONTANEE' | 'AUTRE'
  notes: string | null
  date_entretien: string | null
  created_at: string
}

export interface RecrutementStats {
  offres: { total: number; ouvertes: number }
  candidatures: { total: number; nouveaux: number; entretiens: number; recrutes: number }
}

export const recrutementService = {
  getStats: (): Promise<RecrutementStats> =>
    api.get('/recrutement/stats').then(r => r.data.data),

  getOffres: (params?: Record<string, unknown>): Promise<Offre[]> =>
    api.get('/recrutement/offres', { params }).then(r => r.data.data),

  createOffre: (data: object): Promise<Offre> =>
    api.post('/recrutement/offres', data).then(r => r.data.data),

  updateOffre: (id: number, data: object): Promise<Offre> =>
    api.put(`/recrutement/offres/${id}`, data).then(r => r.data.data),

  deleteOffre: (id: number) =>
    api.delete(`/recrutement/offres/${id}`).then(r => r.data),

  getCandidatures: (params?: Record<string, unknown>): Promise<Candidature[]> =>
    api.get('/recrutement/candidatures', { params }).then(r => r.data.data),

  createCandidature: (data: object): Promise<Candidature> =>
    api.post('/recrutement/candidatures', data).then(r => r.data.data),

  updateCandidature: (id: number, data: object): Promise<Candidature> =>
    api.put(`/recrutement/candidatures/${id}`, data).then(r => r.data.data),

  deleteCandidature: (id: number) =>
    api.delete(`/recrutement/candidatures/${id}`).then(r => r.data),
}
