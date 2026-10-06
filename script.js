const story = document.querySelector('.sky-story');
const stage = document.querySelector('.story-stage');
const backdrop = document.querySelector('.sky-backdrop');
const headlines = [...document.querySelectorAll('.story-headline')];
const progressBar = document.querySelector('.story-progress span');
const counter = document.querySelector('.story-counter');
const canvas = document.querySelector('.star-canvas');
const context = canvas.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let storyProgress = 0;
let framePending = false;
let storyVisible = false;
let width = 0;
let height = 0;
let pixelRatio = 1;
let stars = [];
let shootingStars = [];

function makeStars() {
  const count = window.innerWidth < 700 ? 130 : 260;
  stars = Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    depth: .25 + Math.random() * .75,
    radius: .35 + Math.random() * 1.15,
    phase: Math.random() * Math.PI * 2,
    speed: .0004 + Math.random() * .001
  }));
}

function resizeCanvas() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  makeStars();
  drawStars(performance.now());
}

function drawStars(time) {
  context.clearRect(0, 0, width, height);
  for (const star of stars) {
    const drift = reduceMotion ? 0 : Math.sin(time * star.speed + star.phase) * 3;
    const x = star.x * width + drift + (storyProgress - .5) * width * .08 * star.depth;
    const y = (star.y * height + storyProgress * height * .12 * star.depth) % height;
    const twinkle = reduceMotion ? .58 : .36 + (Math.sin(time * .001 + star.phase) + 1) * .25;
    context.beginPath();
    context.fillStyle = `rgba(218, 242, 255, ${twinkle})`;
    context.arc(x, y, star.radius, 0, Math.PI * 2);
    context.fill();
  }

  if (!reduceMotion && Math.random() < .001) {
    shootingStars.push({ x: Math.random() * width, y: Math.random() * height * .55, age: 0, length: 30 + Math.random() * 70 });
  }
  shootingStars = shootingStars.filter((meteor) => meteor.age < 1);
  for (const meteor of shootingStars) {
    meteor.age += .035;
    const fade = Math.sin(meteor.age * Math.PI);
    context.beginPath();
    context.strokeStyle = `rgba(182, 237, 239, ${fade * .8})`;
    context.lineWidth = 1.2;
    context.moveTo(meteor.x + meteor.age * 90, meteor.y + meteor.age * 52);
    context.lineTo(meteor.x + meteor.age * 90 - meteor.length, meteor.y + meteor.age * 52 - meteor.length * .55);
    context.stroke();
  }
}

function animate(time) {
  if (!storyVisible || reduceMotion) return;
  drawStars(time);
  requestAnimationFrame(animate);
}

function updateStory() {
  framePending = false;
  const range = Math.max(1, story.offsetHeight - window.innerHeight);
  storyProgress = Math.max(0, Math.min(1, -story.getBoundingClientRect().top / range));
  const activeIndex = Math.min(headlines.length - 1, Math.floor(storyProgress * headlines.length));
  stage.style.setProperty('--sky-scale', (1.06 + storyProgress * .11).toFixed(3));
  stage.style.setProperty('--sky-y', `${-storyProgress * 28}px`);
  progressBar.style.width = `${storyProgress * 100}%`;
  counter.innerHTML = `${String(activeIndex + 1).padStart(2, '0')} <b>/ ${String(headlines.length).padStart(2, '0')}</b>`;
  headlines.forEach((headline, index) => {
    const active = index === activeIndex;
    headline.classList.toggle('active', active);
    headline.setAttribute('aria-hidden', String(!active));
  });
  if (reduceMotion) drawStars(performance.now());
}

function scheduleStoryUpdate() {
  if (!framePending) {
    framePending = true;
    requestAnimationFrame(updateStory);
  }
}

new IntersectionObserver(([entry]) => {
  storyVisible = entry.isIntersecting;
  if (storyVisible && !reduceMotion) requestAnimationFrame(animate);
}).observe(story);

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .14 });

document.querySelectorAll('.intro, .activities-heading, .activity-row, .join-copy, .join-note').forEach((element, index) => {
  element.classList.add('motion-reveal');
  element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 75}ms`);
  revealObserver.observe(element);
});
document.body.classList.add('motion-ready');

window.addEventListener('scroll', scheduleStoryUpdate, { passive: true });
window.addEventListener('resize', () => {
  resizeCanvas();
  scheduleStoryUpdate();
}, { passive: true });

resizeCanvas();
scheduleStoryUpdate();


// Modal Logic
const modal = document.getElementById('dept-modal');
const modalClose = document.querySelector('.modal-close');
const modalDeptName = document.getElementById('modal-dept-name');
const modalHead = document.getElementById('modal-head');
const modalCohead = document.getElementById('modal-cohead');

document.querySelectorAll('.activity-row').forEach(row => {
  row.addEventListener('click', () => {
    const deptName = row.querySelector('h3').textContent;
    const head = row.getAttribute('data-head');
    const cohead = row.getAttribute('data-cohead');
    
    modalDeptName.textContent = deptName;
    modalHead.textContent = head;
    modalCohead.textContent = cohead;
    
    if(cohead === 'N/A') {
      modalCohead.parentElement.style.display = 'none';
    } else {
      modalCohead.parentElement.style.display = 'flex';
    }
    
    modal.showModal();
  });
  
  // Also open on Enter key for accessibility
  row.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      row.click();
    }
  });
});

modalClose.addEventListener('click', () => {
  modal.close();
});

modal.addEventListener('click', (e) => {
  const dialogDimensions = modal.getBoundingClientRect();
  if (
    e.clientX < dialogDimensions.left ||
    e.clientX > dialogDimensions.right ||
    e.clientY < dialogDimensions.top ||
    e.clientY > dialogDimensions.bottom
  ) {
    modal.close();
  }
});
