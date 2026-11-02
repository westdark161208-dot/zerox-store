(() => {
  const nav = document.querySelector('.console-nav');
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const groups = new Map(links.map(link => [link.hash.slice(1), [document.getElementById(link.hash.slice(1))]]));
  groups.get('overview').push(document.querySelector('.system-observatory'));
  groups.get('providers').push(document.getElementById('provider-intelligence'));

  function select(scroll = false) {
    const target = document.getElementById(location.hash.slice(1));
    const active = [...groups].find(([, panels]) => target && panels.some(panel => panel.contains(target)))?.[0] || 'overview';
    for (const [key, panels] of groups) {
      for (const panel of panels) panel.toggleAttribute('data-section-inactive', key !== active);
    }
    for (const link of links) {
      if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    if (scroll && target) target.scrollIntoView({block:'start'});
  }
  window.addEventListener('hashchange', () => select(true));
  window.addEventListener('zx-control-ready', () => select());
  select();
})();
