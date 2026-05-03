// Enhanced viewProfile function for admin dashboard
// Replace the existing viewProfile function in admin_dashboard.ejs with this code

async function viewProfile(id) {
    try {
        const response = await fetch(`/admin/staff/${id}`);
        const result = await response.json();
        if (result.success) {
            const data = result.data;
            const profileHtml = `
                <div class="text-left">
                    <!-- Header Section with Gradient -->
                    <div class="bg-gradient-to-r from-blue-600 to-cyan-500 -mx-6 -mt-6 px-8 py-6 mb-6 rounded-t-2xl">
                        <div class="flex items-center gap-5">
                            <div class="relative">
                                <img src="https://ui-avatars.com/api/?name=Dr+${data.firstname}+${data.lastname}&background=ffffff&color=0066CC&bold=true&size=120" 
                                     class="w-24 h-24 rounded-2xl border-4 border-white shadow-xl" alt="Doctor">
                                <div class="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-3xl font-bold text-white mb-1">Dr. ${data.firstname} ${data.lastname}</h3>
                                <div class="flex items-center gap-2 text-blue-100">
                                    <i class="fas fa-stethoscope"></i>
                                    <span class="text-lg font-semibold">${data.department || 'General Medicine'}</span>
                                </div>
                                ${data.rating_avg ? `
                                <div class="flex items-center gap-2 mt-2">
                                    <div class="flex text-yellow-300">
                                        ${'<i class="fas fa-star"></i>'.repeat(Math.floor(data.rating_avg))}
                                        ${data.rating_avg % 1 >= 0.5 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                                    </div>
                                    <span class="text-white font-semibold">${data.rating_avg}/5</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-envelope text-white"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs text-blue-600 font-bold uppercase mb-1">Email</p>
                                    <p class="text-gray-900 font-medium truncate">${data.email}</p>
                                </div>
                            </div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-xl border border-green-100">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-phone text-white"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="text-xs text-green-600 font-bold uppercase mb-1">Mobile</p>
                                    <p class="text-gray-900 font-medium">${data.mobile || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Personal Details -->
                    <div class="bg-gray-50 p-5 rounded-xl mb-6">
                        <h4 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <i class="fas fa-user-circle text-blue-600"></i>
                            Personal Information
                        </h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-venus-mars text-purple-500 mt-1"></i>
                                <div>
                                    <p class="text-xs text-gray-500 uppercase font-semibold">Gender</p>
                                    <p class="text-gray-900 font-medium">${data.gender || 'Not specified'}</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-birthday-cake text-pink-500 mt-1"></i>
                                <div>
                                    <p class="text-xs text-gray-500 uppercase font-semibold">Date of Birth</p>
                                    <p class="text-gray-900 font-medium">${data.dob ? new Date(data.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Professional Qualifications -->
                    <div class="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl mb-6 border border-indigo-100">
                        <h4 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <i class="fas fa-graduation-cap text-indigo-600"></i>
                            Professional Qualifications
                        </h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <p class="text-xs text-indigo-600 uppercase font-bold mb-1">Degree</p>
                                <p class="text-gray-900 font-semibold">${data.degree || 'Not specified'}</p>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <p class="text-xs text-indigo-600 uppercase font-bold mb-1">Specialization</p>
                                <p class="text-gray-900 font-semibold">${data.qualification || 'General Practitioner'}</p>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <p class="text-xs text-indigo-600 uppercase font-bold mb-1">Experience</p>
                                <p class="text-gray-900 font-semibold flex items-center gap-2">
                                    <i class="fas fa-briefcase text-blue-500"></i>
                                    ${data.experience || '0'} years
                                </p>
                            </div>
                            <div class="bg-white p-3 rounded-lg shadow-sm">
                                <p class="text-xs text-indigo-600 uppercase font-bold mb-1">Rating</p>
                                <p class="text-gray-900 font-semibold flex items-center gap-2">
                                    <i class="fas fa-star text-yellow-500"></i>
                                    ${data.rating_avg || 'No ratings yet'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Address -->
                    ${data.address ? `
                    <div class="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-map-marker-alt text-white"></i>
                            </div>
                            <div class="flex-1">
                                <p class="text-xs text-amber-700 uppercase font-bold mb-1">Address</p>
                                <p class="text-gray-900 font-medium leading-relaxed">${data.address}</p>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;

            Swal.fire({
                title: '',
                html: profileHtml,
                width: '700px',
                showConfirmButton: true,
                confirmButtonText: '<i class="fas fa-times mr-2"></i>Close',
                confirmButtonColor: '#0066CC',
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all'
                },
                showClass: {
                    popup: 'animate__animated animate__fadeInDown animate__faster'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                }
            });
        }
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to load doctor profile',
            confirmButtonColor: '#0066CC'
        });
    }
}
