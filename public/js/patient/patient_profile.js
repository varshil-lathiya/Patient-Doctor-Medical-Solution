// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Get user details and update header
const getUserDetails = async () => {
    try {
        const response = await fetch("/patient/userdetails");
        if (response.status == 200) {
            const result = await response.json();
            const user = result.data.user;

            // Update profile header
            document.getElementById('profile-full-name').innerHTML = `${user.firstname} ${user.lastname}`;
            document.getElementById('profile-email-display').innerHTML = user.email;
        }
    } catch (error) {
        console.log(error);
    }
};

// Update profile details
async function profile_detail_update() {
    try {
        const form = document.getElementById("update-patient-form");
        const formData = new FormData(form);
        const jsonData = {};
        formData.forEach((value, key) => jsonData[key] = value);

        showModal('spinner-modal');
        const response = await fetch("/patient/profile/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(jsonData)
        });

        const result = await response.json();
        closeModal('spinner-modal');

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Profile Updated Successfully!',
                confirmButtonColor: '#008B8B'
            }).then(() => {
                closeModal('update-patient-modal');
                window.location.reload(); // Reload to refresh EJS data
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: result.message || 'Please check your inputs'
            });
        }
    } catch (error) {
        closeModal('spinner-modal');
        console.log(error);
        Swal.fire('Error', 'An error occurred while updating profile', 'error');
    }
}

// Logic for opening modal with current data
async function openEditModal() {
    try {
        showModal('spinner-modal');
        const response = await fetch("/patient/userdetails");
        const result = await response.json();
        closeModal('spinner-modal');

        if (response.ok) {
            const data = result.data.user;
            document.getElementById("form-firstname").value = data.firstname || '';
            document.getElementById("form-lastname").value = data.lastname || '';
            document.getElementById("form-mobile").value = data.mobile || '';
            document.getElementById("form-email").value = data.email || '';
            document.getElementById("form-address").value = data.address || '';
            document.getElementById("form-blood_group").value = data.blood_group || '';

            if (data.dob) {
                const date = new Date(data.dob);
                const date_str = date.toISOString().split('T')[0];
                document.getElementById("form-dob").value = date_str;
            }

            if (data.gender) {
                const genderRadio = document.getElementById(`form-${data.gender}`);
                if (genderRadio) genderRadio.checked = true;
            }

            showModal('update-patient-modal');
        }
    } catch (error) {
        closeModal('spinner-modal');
        console.error(error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const editBtn = document.getElementById("edit-btn");
    if (editBtn) {
        editBtn.addEventListener("click", openEditModal);
    }
});