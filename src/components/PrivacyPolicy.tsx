import './PrivacyPolicy.css';

/**
 * Public privacy policy page (/privacy) — the URL to give to the App Store
 * and Google Play. The same text is shown in the app
 * (mysme/lib/features/settings/privacy_policy.dart) — keep both in sync.
 */
const UPDATED_AT = "17 novembre 2026";

const SECTIONS: { title: string; body: string }[] = [
  {
    "title": "En bref",
    "body": "MystMe est une messagerie anonyme. Nous collectons le strict nécessaire pour faire fonctionner le service, nous ne vendons aucune donnée et nous n'affichons aucune publicité ciblée. Tu peux supprimer ton compte et toutes tes données à tout moment depuis les Réglages de l'application."
  },
  {
    "title": "Qui est responsable",
    "body": "MystMe est édité par Freddy2. Pour toute question sur tes données, écris-nous à freddywafo3@gmail.com."
  },
  {
    "title": "Les données que nous traitons",
    "body": "• Ton identité anonyme : un identifiant aléatoire, un pseudo et un avatar générés automatiquement, et la bio que tu choisis d'écrire.\n• Ton adresse email, uniquement si tu décides de l'ajouter pour pouvoir récupérer ton compte.\n• Tes conversations : les messages, photos, vidéos, audios et fichiers que tu envoies ou reçois.\n• Un jeton de notification, si tu actives les notifications.\n• Des données techniques : ton adresse IP et des journaux d'activité, utilisés pour protéger le service contre les abus.\n• Les signalements que tu envoies ou qui te concernent.\n\nNous ne te demandons ni ton nom, ni ton numéro de téléphone, ni ton carnet de contacts, ni ta position."
  },
  {
    "title": "Ce que voit la personne à qui tu écris",
    "body": "Quand tu écris via le lien de quelqu'un, cette personne voit un pseudo et un avatar créés pour cette seule conversation. Elle ne voit ni ton pseudo habituel, ni ton identifiant, ni ton email, ni si tu es en ligne.\n\nAttention : le contenu de tes messages peut te trahir. Ne partage pas d'informations qui permettent de t'identifier si tu veux rester anonyme."
  },
  {
    "title": "Les limites de l'anonymat",
    "body": "Les messages ne sont pas chiffrés de bout en bout : ils sont stockés sur nos serveurs. Notre équipe de modération peut consulter une conversation lorsqu'elle est signalée. Nous pouvons aussi être amenés à transmettre des données aux autorités lorsque la loi nous y oblige."
  },
  {
    "title": "Pourquoi nous utilisons ces données",
    "body": "• Faire fonctionner la messagerie et te livrer tes messages.\n• T'envoyer les notifications que tu as activées.\n• Te permettre de récupérer ton compte (clé de récupération ou email).\n• Lutter contre le harcèlement, le spam et les abus, et traiter les signalements.\n\nNous n'utilisons pas tes données à des fins publicitaires et nous ne les vendons pas."
  },
  {
    "title": "Nos prestataires",
    "body": "Tes données sont hébergées et traitées par des prestataires techniques, uniquement pour notre compte : Railway (serveurs et base de données), Cloudinary (photos, vidéos, audios et fichiers), Google Firebase (notifications), Brevo (envoi des emails de vérification), Vercel (site web) et DiceBear (génération des avatars). Certains de ces prestataires sont situés hors de ton pays, notamment aux États-Unis."
  },
  {
    "title": "Combien de temps nous les gardons",
    "body": "• Compte créé dans l'application : jusqu'à ce que tu le supprimes.\n• Session ouverte depuis le site web sans installer l'application : tu peux écrire pendant 7 jours, puis lire pendant 30 jours ; elle est ensuite effacée automatiquement avec ses conversations.\n• Un message que tu supprimes disparaît de la conversation ; il est effacé définitivement de nos serveurs lors de la suppression du compte ou de la conversation.\n• Codes de vérification par email : 10 minutes.\n• Compteurs anti-abus liés à l'adresse IP : 24 heures."
  },
  {
    "title": "Supprimer ton compte",
    "body": "Dans l'application : Réglages, puis « Supprimer mon compte ». La suppression est immédiate et définitive : ton compte, ton lien, tes conversations, tes messages et tes fichiers sont effacés, y compris chez tes correspondants. Si tu n'as plus accès à l'application, écris-nous à freddywafo3@gmail.com."
  },
  {
    "title": "Tes droits",
    "body": "Tu peux demander l'accès à tes données, leur rectification, leur effacement, ou t'opposer à leur traitement en nous écrivant à freddywafo3@gmail.com. Tu peux aussi saisir l'autorité de protection des données de ton pays."
  },
  {
    "title": "Âge minimum",
    "body": "MystMe est réservé aux personnes de 16 ans et plus. Si nous apprenons qu'un compte appartient à une personne plus jeune, nous le supprimons."
  },
  {
    "title": "Sécurité",
    "body": "Les échanges avec nos serveurs sont chiffrés (HTTPS). Sur ton téléphone, ta session est conservée dans le stockage sécurisé du système. Aucun système n'est infaillible : si tu constates un problème de sécurité, préviens-nous à freddywafo3@gmail.com."
  },
  {
    "title": "Modifications",
    "body": "Nous mettrons cette page à jour si nos pratiques changent. La date ci-dessous indique la dernière mise à jour."
  }
];

export default function PrivacyPolicy() {
  return (
    <div className="privacy-page">
    <main className="privacy">
      <h1 className="privacy-title">Politique de confidentialité</h1>
      <p className="privacy-app">MystMe</p>
      {SECTIONS.map((section) => (
        <section key={section.title} className="privacy-section">
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <p className="privacy-updated">Dernière mise à jour : {UPDATED_AT}</p>
    </main>
    </div>
  );
}
