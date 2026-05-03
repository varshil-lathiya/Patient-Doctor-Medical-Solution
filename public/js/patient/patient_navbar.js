// Patient Navigation Script

// Set active navigation item based on current URL
document.addEventListener('DOMContentLoaded', function () {
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    const href = item.getAttribute('href');

    // Remove active class from all items
    item.classList.remove('active');
    item.classList.remove('bg-white/20', 'text-white');
    item.classList.add('text-white/80');

    // Add active class to current page
    if (href && currentPath.includes(href)) {
      item.classList.add('active');
      item.classList.add('bg-white/20', 'text-white');
      item.classList.remove('text-white/80');
    }
  });
});

// Legacy functions for backward compatibility (if needed)
function dashboard() {
  window.location.href = `/patient/dashboard`;
}

function appointments() {
  window.location.href = `/patient/appointments`;
}

function history() {
  window.location.href = `/patient/history`;
}

function profile() {
  window.location.href = '/patient/profile';
}

