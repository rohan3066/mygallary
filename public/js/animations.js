document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.heart-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-pulse', 'opacity-100');
        card.classList.remove('opacity-0');
      }, index * 200);
    });
  });