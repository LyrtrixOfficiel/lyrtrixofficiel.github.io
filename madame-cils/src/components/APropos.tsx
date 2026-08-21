import { Reveal } from './Reveal';
import { TitreSection } from './TitreSection';
import { INSTAGRAM, INSTAGRAM_HANDLE, PRATICIENNE, ZONE_PROSE } from '../data/site';
import { LIEN_EXTERNE } from '../lib/booking';

/** A propos — le ton reprend celui de ses legendes : vouvoiement, phrases nettes. */
export function APropos() {
  return (
    <Reveal className="section pad-x" id="a-propos">
      <TitreSection numero="03" id="titre-a-propos">
        {PRATICIENNE}
      </TitreSection>

      <div className="mesure mt-6 space-y-4 text-muted">
        <p>
          Depuis 2022, {PRATICIENNE} pose et rehausse les cils à {ZONE_PROSE}. Extensions
          uniquement — c’est le seul métier qu’elle exerce, et c’est ce qui explique
          les 214 avis à 5 sur 5.
        </p>
        <p>
          Chaque rendez-vous commence par la même question : la morphologie de votre œil,
          l’état de vos cils naturels, ce que vous voulez voir dans le miroir. La courbure,
          la longueur et la densité se décident là. Une pose qui ne respecte pas le cil
          naturel ne tient pas, et abîme.
        </p>
        <p>
          Du plus discret au plus dense : cils à cils, mixte, volume russe. Et si vous
          préférez ne rien ajouter, le rehaussement recourbe vos cils dès la racine.
        </p>
      </div>

      <a
        href={INSTAGRAM}
        {...LIEN_EXTERNE}
        className="mt-6 inline-flex min-h-11 items-center gap-2 text-accent underline underline-offset-4"
      >
        {INSTAGRAM_HANDLE} sur Instagram
      </a>
    </Reveal>
  );
}
