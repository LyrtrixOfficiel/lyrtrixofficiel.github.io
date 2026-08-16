/**
 * Les pièces de Stéphane.
 *
 * Les textes sont les siens, repris de ses publications, débarrassés des
 * mots-dièse. On ne les réécrit pas : c'est sa voix qui fait la valeur de la
 * page, et un texte d'atelier vaut mieux qu'une fiche produit.
 *
 * `code`     l'identifiant de la publication d'origine, qui sert aussi de nom
 *            de fichier pour la photo et de lien de retour vers Instagram.
 * `familles` une pièce peut appartenir à plusieurs rayons. Une lampe en bois
 *            flotté est une lampe ET du bois flotté ; forcer un seul rayon
 *            reviendrait à la cacher à la moitié des gens qui la cherchent.
 * `ratio`    largeur sur hauteur de la photo. Réservé dans la grille avant que
 *            l'image n'arrive, sinon la mosaïque saute pendant le chargement.
 */

export const FAMILLES = [
  { cle: 'tout',      nom: 'Tout' },
  { cle: 'lampes',    nom: 'Lampes' },
  { cle: 'flotte',    nom: 'Bois flotté' },
  { cle: 'vases',     nom: 'Vases et soliflores' },
  { cle: 'jeux',      nom: 'Jeux et jouets' },
  { cle: 'ecriture',  nom: 'Écriture' },
  { cle: 'quotidien', nom: 'Le quotidien' },
];

export const CREATIONS = [
  {
    code: 'Da9og5Toqz_', titre: 'La bougie du rivage', ratio: 640 / 1136,
    familles: ['lampes', 'flotte'], matieres: ['bois flotté', 'buis', 'fer plat'],
    texte: "Morceau de bois ramassé sur le sable, une deuxième vie commence. Cache-douille tourné dans un morceau de buis, anse en fer plat pour un côté rétro et la stabilité de l'ensemble.",
  },
  {
    code: 'Da8hlFCo2OR', titre: "L'abat-jour soudé", ratio: 640 / 1138,
    familles: ['lampes', 'flotte'], matieres: ['bois flotté', 'fer plat', 'fer rond', 'soudure'],
    texte: "Un morceau de bois qui inspire, et pourtant ce n'était pas gagné. Beaucoup de nettoyage, de ponçage. La vision de la lampe était là, le carnage aussi, restait à confectionner la carcasse. Fer plat et fer rond assemblés par soudure, naissance de l'abat-jour.",
  },
  {
    code: 'DSLLLqNiG2n', titre: 'La lampe à tiroir', ratio: 1440 / 1920,
    familles: ['lampes'], matieres: ['bois tourné'],
    texte: "Originale et secrète, un petit tiroir pour y déposer une friandise, un bijou, des billets. L'heureux ou l'heureuse propriétaire trouvera bien quoi y mettre.",
  },
  {
    code: 'DR1hNufiH9R', titre: 'Lampe à secrets, pour les amoureux', ratio: 1440 / 1906,
    familles: ['lampes'], matieres: ['bois tourné'],
    texte: "Autre lampe à secrets, pour les amoureux.",
  },
  {
    code: 'DRxY79dCKyX', titre: 'Ambiance du soir', ratio: 1440 / 1920,
    familles: ['lampes'], matieres: ['bois tourné'],
    texte: "Ambiance du soir, lampe à secrets. Ambiance de jour, décorative et secrète.",
  },
  {
    code: 'DRu44I5iB4g', titre: 'Deux soliflores en glycine', ratio: 1438 / 1088,
    familles: ['vases'], matieres: ['glycine'],
    texte: "Deux petits récipients réalisés dans de la glycine. Bois très facile à travailler, d'une couleur très claire faisant penser au bouleau. Un joli moment de tournage.",
  },
  {
    code: 'DRDHUqMiPfe', titre: 'À chacun sa plume', ratio: 1440 / 1920,
    familles: ['ecriture'], matieres: ['bois tourné', 'plume'],
    texte: "À chacun sa plume.",
  },
  {
    code: 'DQuqKrpiHQv', titre: 'Le stylo de prunus', ratio: 1440 / 1440,
    familles: ['ecriture'], matieres: ['prunus', 'noyer', 'plume de paon'],
    texte: "Stylo en prunus, un bois de plus de 120 ans d'âge. L'encrier, sa base est en noyer surmontée d'un élément en prunus, la plume vient d'un paon qui était bleu et faisait une magnifique roue.",
  },
  {
    code: 'DQglop0iHPl', titre: 'Le bois de Lucie', ratio: 1440 / 1080,
    familles: ['lampes', 'flotte'], matieres: ['bois trouvé'],
    texte: "Merci Lucie pour ce joli morceau de bois que tu m'as donné il y a bien trois ans. Il est passé par toutes sortes d'idées non abouties, et c'est un malheureux coup de tronçonneuse qui a révélé ce que je ne voyais pas. Sa forme originale, son toucher soyeux. Reste peut-être à lui trouver un autre abat-jour.",
  },
  {
    code: 'DOdwyRdiF0B', titre: 'Entre lacet de fleurs séchées', ratio: 1440 / 1920,
    familles: ['vases'], matieres: ['bois tourné', 'cuir'],
    texte: "Entre lacet de fleurs séchées, prélude à l'automne.",
  },
  {
    code: 'DEDgkUkojLU', titre: 'Le ballon de pommier', ratio: 1440 / 1800,
    familles: ['jeux'], matieres: ['pommier', 'bambou', 'rotin', 'pyrogravure'],
    texte: "Petit challenge, ce ballon de rugby de 230 mm de long en pommier de la Nièvre, la valve en bambou du jardin, et les ligatures en rotin, mises en place après les avoir trempées dans l'eau pour leur donner forme. Le tee est en noyer de l'Orne. L'outil de pyrogravure a servi pour les dessins et les initiales : personnalisable sur demande.",
  },
  {
    code: 'DD7c5-cI7gu', titre: 'Le jeu revisité', ratio: 640 / 1136,
    familles: ['jeux'], matieres: ['pin'],
    texte: "Jeu revisité, dimensions du tour obligent. Bref, un prototype en pin, c'est de saison.",
  },
  {
    code: 'DC4SvtkIwaD', titre: 'Sapins et bonshommes', ratio: 1440 / 1800,
    familles: ['jeux'], matieres: ['bois tourné', 'peinture'],
    texte: "Dans moins d'un mois, Noël.",
  },
  {
    code: 'DCXAbq8oola', titre: 'La petite escadrille', ratio: 1440 / 1800,
    familles: ['jeux'], matieres: ['bois tourné', 'peinture'],
    texte: "En partie bois tourné, petite escadrille prête à fendre l'air.",
  },
  {
    code: 'DB517bIoWub', titre: 'Prisonnière, cadenassée', ratio: 1440 / 1800,
    familles: ['lampes'], matieres: ['bois tourné', 'métal'],
    texte: "Prisonnière, cadenassée, pour qui, pour quoi ? Autant de questions dont le propriétaire pourrait avoir à répondre.",
  },
  {
    code: 'DA8OR58IruR', titre: 'Petites boîtes, noyer et buis', ratio: 720 / 900,
    familles: ['quotidien'], matieres: ['noyer', 'buis', 'prunus'],
    texte: "Petites boîtes : noyer et buis, noyer et prunus. Doux plaisir à travailler. Mes pensées vont vers les donateurs, merci.",
  },
  {
    code: 'DA8NO05IRuh', titre: 'Le vase sauvé du bûcher', ratio: 1440 / 1800,
    familles: ['vases'], matieres: ['bois tourné'],
    texte: "Moyen vase, sans prétention, laissant apparaître certains stigmates qui le conduisaient au bûcher. Mais voilà, une nouvelle vie se profile, hâte qu'il s'épanouisse dans un foyer où il fait bon vivre.",
  },
  {
    code: 'DAV5M_4ocw1', titre: 'Nouvel instrument', ratio: 1440 / 1440,
    familles: ['jeux'], matieres: ['bois tourné'],
    texte: "Nouvel instrument de musique.",
  },
  {
    code: 'DAJKijjIcqd', titre: 'Le pot à confiture', ratio: 1440 / 1800,
    familles: ['quotidien'], matieres: ['bois tourné', 'métal'],
    texte: "Et pour clore la série, un petit dernier qui accueillera ce que tu voudras.",
  },
  {
    code: 'DAJKCvvoppz', titre: 'Le pot détourné', ratio: 1440 / 1534,
    familles: ['quotidien'], matieres: ['bois tourné', 'métal'],
    texte: "Allez, soyons fous, il n'y a pas que dans la gastronomie que l'on revisite. Ici, ce pot à confiture détourné servira de rangement pour ses sous-verres.",
  },
  {
    code: 'DAIoBVNIOSg', titre: 'Le porte sous-verres', ratio: 720 / 900,
    familles: ['quotidien'], matieres: ['bois tourné'],
    texte: "Porte sous-verres et ses six sous-verres. Le contenant a failli partir au rebut, une idée est venue, et ma foi le résultat est plutôt pas mal.",
  },
  {
    code: 'C_v9ImpI6DW', titre: 'Le morpion', ratio: 1440 / 1440,
    familles: ['jeux'], matieres: ['bois tourné'],
    texte: "Morpion, jeu que l'on ne présente plus. De la simple feuille de papier à la création la plus sophistiquée, il est partout, à la maison comme en voyage. Il passe le temps aux plus jeunes comme aux moins jeunes.",
  },
  {
    code: 'C_hr430IpgX', titre: 'Le retour des toupies', ratio: 1440 / 1440,
    familles: ['jeux'], matieres: ['bois tourné', 'peinture'],
    texte: "Les toupies font leur retour, avant de changer de mains pour le plus grand bonheur des petits et des grands.",
  },
  {
    code: 'C-WAn4Co42b', titre: 'La lampe en thuya', ratio: 1440 / 1440,
    familles: ['lampes'], matieres: ['thuya', 'acrylique'],
    texte: "Lampe en thuya, décoration extérieure à la peinture acrylique.",
  },
  {
    code: 'C97CUSpIqJy', titre: "L'horloge de bois flotté", ratio: 1440 / 1440,
    familles: ['quotidien', 'flotte'], matieres: ['bois flotté', 'fer plat', 'acrylique'],
    texte: "Horloge réalisée en bois flotté. Fer plat formé en cercle, fond en médium de 10 mm. Chaque élément a été soigneusement sélectionné et travaillé de sorte qu'il ne dépasse pas trop, pour le passage des aiguilles. Le mécanisme est basique, les aiguilles ont été réalisées également en bois flotté. Un ajout de couleurs à l'acrylique pour rehausser l'ensemble.",
  },
  {
    code: 'C8BLbowOj7X', titre: 'La lampe en trois éléments', ratio: 1080 / 1920,
    familles: ['lampes'], matieres: ['bois brûlé', 'fer plat', 'cire'],
    texte: "Nouvelle lampe, nouveau design, en trois éléments. Le socle en fer plat qui reçoit le fond de la lampe, le fond, et le corps. Ce dernier légèrement brûlé donne cette teinte plus foncée par endroits, de la peinture jaune tamponnée avant d'être cirée.",
  },
  {
    code: 'C72WVNTIp53', titre: 'Le bois vert et la corde', ratio: 1440 / 1800,
    familles: ['lampes', 'flotte'], matieres: ['bois flotté', 'bois vert', 'corde', 'liane'],
    texte: "Élément principal, joli morceau de bois flotté. Abat-jour en bois vert, corde, liane, et petites fleurs.",
  },
  {
    code: 'C7pWe-6IAgH', titre: 'Duo', ratio: 1440 / 1800,
    familles: ['lampes', 'flotte'], matieres: ['bois flotté'],
    texte: "Bois flotté à gogo, sauf la base de l'ampoule. Duo : un homme enlace une femme au rythme d'une musique certainement très caliente. La flamme virevolte en accompagnant ces deux corps qui resteront deux bois.",
  },
  {
    code: 'C5MXua-uLZs', titre: "Le chaudron", ratio: 1080 / 1920,
    familles: ['lampes'], matieres: ['bois tourné', 'fer plein', 'fer plat'],
    texte: "Non ! Obélix, tu es tombé dedans quand tu étais petit. Chaudron malheureusement pas magique, pas de potion. Posé sur trois pieds, le contour paré de flammes. Son anse : poignée en bois tournée insérée le long d'un fer plein, les extrémités de fixation et les rivets en bois sont peints en noir. Ampoule LED imitation feu, cerclage en fer plat peint en rouge à la base.",
  },
  {
    code: 'C4yvodcoSE0', titre: 'Le phare de buis', ratio: 640 / 800,
    familles: ['quotidien'], matieres: ['buis', 'cerisier', 'LED'],
    texte: "Nouveau projet concernant la mer, un bon amusement. Le phare en buis a été réalisé en bois tourné, le dôme est un fond d'éprouvette en plastique, et à l'intérieur une LED qui fonctionne en USB, en veilleuse. Le rocher en cerisier, quelque peu dénaturé de son état originel par de la sculpture, en partie brut et en partie peint.",
  },
  {
    code: 'C4kQ_GuPvh6', titre: 'Les deux bolinettes', ratio: 1080 / 1920,
    familles: ['quotidien'], matieres: ['bois tourné'],
    texte: "Support accueillant deux bolinettes. Ici des fleurs séchées, mais pourquoi pas des trombones, des punaises, des bonbons, de la monnaie, des timbres.",
  },
  {
    code: 'C4ZJWpEI-XW', titre: 'Soliflore sur son socle', ratio: 1440 / 1800,
    familles: ['vases'], matieres: ['bois tourné'],
    texte: "Soliflore posé sur son socle.",
  },
  {
    code: 'C3xvxmrIe8l', titre: 'Porte-bougie sur fond endiablé', ratio: 1440 / 1800,
    familles: ['quotidien'], matieres: ['bois tourné'],
    texte: "Porte-bougie sur un fond endiablé.",
  },
  {
    code: 'C3xuo5TogCL', titre: 'Petits soliflores', ratio: 1440 / 1800,
    familles: ['vases'], matieres: ['cerisier'],
    texte: "Jolis petits soliflores, environ 130 mm de haut, en bois tourné, avec un alésage d'environ 60 mm de profondeur. Un bout de bois, un bout de ficelle, des fleurs séchées, et le tour est joué.",
  },
  {
    code: 'CgPdDFXI-0c', titre: 'Le réveil de pin', ratio: 706 / 822,
    familles: ['quotidien'], matieres: ['pin', 'métal'],
    texte: "Un réveil à 99 % en pin, et les aiguilles en métal que j'ai aussi réalisées, pour vous servir.",
  },
];

/** Hors catalogue : une photo de l'étal, qui n'est pas une pièce à vendre. */
export const ETAL = { code: 'DQnbN9RiAOB', ratio: 1440 / 999,
  texte: "Préparation des futurs marchés de Noël, jeux terminés." };
