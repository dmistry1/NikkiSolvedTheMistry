/* Tweaks island for the engagement evite.
   Mounts a small panel; applies choices to CSS vars / data attributes. */

const INVITE_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "rose",
  "namesFont": "serif",
  "envTone": "peach",
  "motif": true,
  "damask": true,
  "seal": "om",
  "monogram": "D & S"
}/*EDITMODE-END*/;

const ACCENTS = {
  rose:    { a: '#B5786A', b: '#CC9C8C' },
  gold:    { a: '#B8965A', b: '#CBB07E' },
  blush:   { a: '#C98A93', b: '#DCA9AE' }
};
const ENV_TONES = {
  peach: { p: '#F3D4BE', p2: '#EAC0A2' },
  blush: { p: '#E8BFB9', p2: '#D8A29C' },
  cream: { p: '#EFE0CE', p2: '#E0CAAF' }
};
const FONTS = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans:  "'Hanken Grotesk', system-ui, sans-serif"
};

function applyTweaks(t) {
  const r = document.documentElement;
  const ac = ACCENTS[t.accent] || ACCENTS.rose;
  r.style.setProperty('--accent', ac.a);
  r.style.setProperty('--accent-2', ac.b);

  const tone = ENV_TONES[t.envTone] || ENV_TONES.peach;
  r.style.setProperty('--peach', tone.p);
  r.style.setProperty('--peach-2', tone.p2);

  r.style.setProperty('--font-display', FONTS[t.namesFont] || FONTS.serif);

  r.dataset.arch = t.motif ? 'on' : 'off';
  r.style.setProperty('--damask', t.damask ? 'url("pattern.png")' : 'none');

  const mono = (t.monogram || 'D & S').trim();
  document.querySelectorAll('[data-mono]').forEach((el) => { el.textContent = mono; });

  const seal = document.querySelector('[data-seal]');
  if (seal) {
    if (t.seal === 'initials') {
      seal.classList.remove('om');
      seal.textContent = mono.replace(/\s+/g, '');
    } else {
      seal.classList.add('om');
      seal.textContent = '\u0950';
    }
  }
}

function InviteTweaks() {
  const [t, setTweak] = useTweaks(INVITE_TWEAKS);

  React.useEffect(() => { applyTweaks(t); }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Palette" />
      <TweakRadio
        label="Accent metal" value={t.accent}
        options={['rose', 'gold', 'blush']}
        onChange={(v) => setTweak('accent', v)} />
      <TweakRadio
        label="Envelope tone" value={t.envTone}
        options={['peach', 'blush', 'cream']}
        onChange={(v) => setTweak('envTone', v)} />

      <TweakSection label="Type & motif" />
      <TweakRadio
        label="Names typeface" value={t.namesFont}
        options={['serif', 'sans']}
        onChange={(v) => setTweak('namesFont', v)} />
      <TweakToggle
        label="Cartouche frame" value={t.motif}
        onChange={(v) => setTweak('motif', v)} />
      <TweakToggle
        label="Damask pattern" value={t.damask}
        onChange={(v) => setTweak('damask', v)} />

      <TweakSection label="Seal" />
      <TweakRadio
        label="Seal symbol" value={t.seal}
        options={['om', 'initials']}
        onChange={(v) => setTweak('seal', v)} />
      <TweakText
        label="Initials" value={t.monogram}
        onChange={(v) => setTweak('monogram', v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<InviteTweaks />);
