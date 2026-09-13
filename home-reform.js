(()=>{
  const apply=()=>{
    if(document.body?.dataset?.page!=='home') return;
    const main=document.querySelector('main');
    if(!main || main.dataset.reformed==='true') return;
    main.dataset.reformed='true';
    document.title='Till | Creator · Development · Politik';
    const description=document.querySelector('meta[name="description"]');
    if(description) description.content='Till – YouTube, Leitstellen Manager, Development, Politik & EVP sowie Engagement für Menschen mit Behinderungen.';

    main.innerHTML=`
      <section class="hero">
        <div class="hero-noise"></div>
        <div class="hero-copy">
          <span class="eyebrow">CREATOR · DEVELOPMENT · ENGAGEMENT</span>
          <h1>Ideen bauen.<br><span>Projekte bewegen.</span></h1>
          <p class="lead">Ich bin Till. Auf dieser Webseite verbinde ich YouTube, Development, Gaming-Projekte und mein politisches Engagement für Menschen mit Behinderungen und faire Chancen.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="/ueber-mich">Mehr über mich</a>
            <a class="btn btn-ghost" href="/projekte">Projekte entdecken</a>
            <a class="btn btn-ghost" href="/politik">Politik & EVP</a>
          </div>
          <div class="quick-stats">
            <div><strong>▶</strong><span>YouTube & Content</span></div>
            <div><strong>DEV</strong><span>Eigene Projekte</span></div>
            <div><strong>EVP</strong><span>Politisches Engagement</span></div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="game-window">
            <div class="window-bar"><span></span><span></span><span></span><b>till://current-focus</b></div>
            <div class="terminal-lines">
              <code><i>01</i> youtube = ACTIVE</code>
              <code><i>02</i> leitstellen_manager = ACTIVE</code>
              <code><i>03</i> politics_evp = ACTIVE</code>
              <code class="success"><i>04</i> BUILD · IMPROVE · MOVE ✓</code>
            </div>
            <div class="pixel-scene"><div class="pixel-sun"></div><div class="pixel-block b1"></div><div class="pixel-block b2"></div><div class="pixel-block b3"></div><div class="pixel-block b4"></div></div>
          </div>
        </div>
      </section>

      <section class="ticker"><div>YOUTUBE <span>◆</span> LEITSTELLEN MANAGER <span>◆</span> DEVELOPMENT <span>◆</span> POLITIK & EVP <span>◆</span> INKLUSION <span>◆</span> PROJEKTE</div></section>

      <section class="section">
        <div class="section-heading">
          <div><span class="eyebrow">AUF EINEN BLICK</span><h2>Was mich aktuell beschäftigt.</h2></div>
          <p>Die Webseite ist mein zentraler Ort für aktuelle Projekte, Content und gesellschaftliche Themen.</p>
        </div>
        <div class="feature-grid">
          <article class="feature-card"><span class="feature-num">01</span><div class="feature-icon">▶</div><h3>YouTube</h3><p>Videos, Shorts, Gaming und Updates zu meinen Projekten.</p><a href="https://www.youtube.com/@tills109" target="_blank" rel="noopener noreferrer">Kanal öffnen →</a></article>
          <article class="feature-card"><span class="feature-num">02</span><div class="feature-icon">⌘</div><h3>Development</h3><p>Eigene Games, Webseiten, Systeme und laufende technische Experimente.</p><a href="/projekte">Projekte ansehen →</a></article>
          <article class="feature-card"><span class="feature-num">03</span><div class="feature-icon">EVP</div><h3>Politik & Engagement</h3><p>Teilhabe, faire Bildungschancen und bessere Möglichkeiten für Menschen mit Behinderungen.</p><a href="/politik">Politikseite öffnen →</a></article>
          <article class="feature-card"><span class="feature-num">04</span><div class="feature-icon">↗</div><h3>Ideen umsetzen</h3><p>Von der ersten Idee bis zur funktionierenden Version: ausprobieren, testen und verbessern.</p><a href="/ueber-mich">Meine Story →</a></article>
        </div>
      </section>

      <section class="section section-dark">
        <div class="section-heading"><div><span class="eyebrow">AKTUELLER FOKUS</span><h2>Drei Bereiche. Ein persönlicher Hub.</h2></div><a class="text-link" href="/projekte">Alle Projekte →</a></div>
        <div class="project-showcase">
          <article class="project-large gradient-blue">
            <div class="project-top"><span class="pill">Game Development</span><span class="status active">Aktiv</span></div>
            <div><small>MANAGEMENT GAME</small><h3>Leitstellen Manager</h3><p>Ein eigenes Management-Projekt mit Einsätzen, Karten, Fahrzeugverwaltung, Benutzeroberflächen und laufenden grossen Updates.</p></div>
            <a href="/projekte">Projektübersicht öffnen →</a>
          </article>
          <div class="project-stack">
            <article class="project-small gradient-orange"><span class="pill">YouTube</span><h3>Content & Community</h3><p>Videos, Shorts und direkte Updates zu Gaming, Projekten und neuen Ideen.</p><a class="text-link" href="https://www.youtube.com/@tills109" target="_blank" rel="noopener noreferrer">YouTube öffnen →</a></article>
            <article class="project-small gradient-mc"><span class="pill">Politik & EVP</span><h3>Teilhabe & faire Chancen</h3><p>Mein Engagement für Menschen mit Behinderungen, flexible Ausbildungswege und konkrete Veränderungen.</p><a class="text-link" href="/politik">Mehr erfahren →</a></article>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading"><div><span class="eyebrow">ÜBER MICH</span><h2>Mehr als nur Gaming.</h2></div><a class="text-link" href="/ueber-mich">Zur ganzen Story →</a></div>
        <div class="project-showcase">
          <article class="project-card">
            <img src="assets/till-profile.jpg" alt="Till" loading="lazy" decoding="async" style="width:100%;display:block;aspect-ratio:4/3;object-fit:cover">
            <div class="project-content"><div class="project-meta"><span class="pill">Till</span><span class="status active">Creator</span></div><h3>Neugierig, direkt und projektorientiert.</h3><p>Ich beschäftige mich mit Technik, YouTube, Games und gesellschaftlichen Themen. Besonders wichtig ist mir, Ideen nicht nur zu diskutieren, sondern daraus konkrete Projekte zu machen.</p></div>
          </article>
          <article class="project-large gradient-blue">
            <div class="project-top"><span class="pill">Meine Themen</span><span class="status active">2026</span></div>
            <div><small>WAS MICH ANTREIBT</small><h3>Technik verstehen. Dinge verbessern. Menschen erreichen.</h3><p>Development gibt mir die Möglichkeit, eigene Systeme zu bauen. YouTube macht Projekte sichtbar. Politisches Engagement gibt mir eine Möglichkeit, Themen wie Teilhabe und faire Ausbildungschancen öffentlich zu vertreten.</p></div>
            <a href="/ueber-mich">Über mich lesen →</a>
          </article>
        </div>
      </section>

      <section class="section section-dark">
        <div class="youtube-panel">
          <div><span class="eyebrow">YOUTUBE</span><h2>Videos, Shorts & Projekt-Updates.</h2><p>Auf meinem Kanal zeige ich Gaming-Content, neue Ideen und Updates zu meinen aktuellen Projekten. Die Webseite und YouTube sollen sich dabei gegenseitig ergänzen.</p><div class="hero-actions"><a class="btn btn-primary" href="https://www.youtube.com/@tills109" target="_blank" rel="noopener noreferrer">YouTube-Kanal öffnen</a><a class="btn btn-ghost" href="/team">YouTube-Team</a></div></div>
          <div class="youtube-mock"><div class="play-circle">▶</div><span>TILLS109</span><h3>Content mit eigenen Projekten.</h3></div>
        </div>
      </section>

      <section class="section">
        <div class="cta">
          <div><span class="eyebrow">ENTDECKEN</span><h2>Alles an einem Ort.</h2><p>Mehr über mich, meine Projekte, mein Team und mein politisches Engagement findest du direkt hier auf der Webseite.</p></div>
          <div class="hero-actions"><a class="btn btn-primary" href="/projekte">Projekte</a><a class="btn btn-ghost" href="/politik">Politik & EVP</a><a class="btn btn-ghost" href="/kontakt">Kontakt</a></div>
        </div>
      </section>`;

    document.querySelectorAll('main .section > *, main .hero-copy > *, main .hero-visual').forEach(el=>el.classList.add('reveal-ready','reveal-in'));
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true}); else apply();
})();
