function redirect_schedule() {
  window.location.href = "/receptionist/dashboard";
}
function redirect_add_appointments() {
  window.location.href = "/receptionist/appointments";
}
function redirect_doctors() {
  window.location.href = "/receptionist/doctors";
}
function redirect_profile() {
  window.location.href = "/receptionist/profile";
}
function redirect_patients() {
  window.location.href = "/receptionist/patients";
}

function logout() {
  Swal.fire({
    title: 'Logout?',
    text: 'Are you sure you want to logout?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, logout',
  }).then((r) => {
    if (r.isConfirmed) window.location.href = "/logout";
  });
}
