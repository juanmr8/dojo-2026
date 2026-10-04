Import everything from '@/typesplit':

  import { TypeSplit, InView, Scrub, BlurIn } from '@/typesplit';

  <TypeSplit as='h1' text='…' split={['word']}>
    <InView start='top 85%'><BlurIn duration={1.1} stagger={0.035} /></InView>
  </TypeSplit>

A new effect: a headless component next to effects/blur-in.tsx that
calls useTargets(level), builds a paused GSAP timeline and hands it
to useDriver().attach(). Tests need vitest + jsdom + Testing Library
(piece 02's package.json and vitest.config.mts are the setup).
