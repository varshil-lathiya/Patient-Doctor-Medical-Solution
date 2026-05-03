// async function getAppointments() {
//   const spinner = document.getElementById("spinner-modal");
//   spinner.classList.remove("hidden");

//   try {
//     const response = await fetch("/patient/appointments");
//     const data = await response.json();

//     if (response.status === 401) {
//       window.location.href = "/login";
//       return;
//     }

//     if (!data?.data?.appointments) {
//       alert("No appointments found!");
//       return;
//     }

//     renderAppointments(data.data.appointments);
//   } catch (err) {
//     console.error("Error fetching appointments:", err);
//     alert("Unable to fetch appointments");
//   } finally {
//     spinner.classList.add("hidden");
//   }
// }

// function renderAppointments(appointments) {
//   const upcomingSection = document.getElementById("upcoming-section");
//   const pastSection = document.getElementById("past-section");

//   upcomingSection.innerHTML = "";
//   pastSection.innerHTML = "";

//   const today = new Date();

//   appointments.forEach((app) => {
//     const appDate = new Date(app.date);
//     const doctorName = `Dr. ${app.doctor_firstname} ${app.doctor_lastname}`;
//     const specialization = app.specialization;
//     const formattedDate = appDate.toLocaleDateString();
//     const formattedTime = app.time.slice(0, 5); // "HH:MM"

//     const card = document.createElement("div");
//     card.className =
//       "bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-6";

//     const statusClass =
//       app.status === "cancelled"
//         ? "bg-red-500"
//         : app.status === "fullfilled"
//         ? "bg-green-500"
//         : app.status === "not-attended"
//         ? "bg-yellow-500"
//         : "bg-primary-teal";

//     let cardHTML = `
//       <div class="flex items-center justify-between">
//         <div class="flex items-center gap-4">
//           <div class="w-20 h-20 rounded-full overflow-hidden border-4 border-primary-teal shadow-lg">
//             <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(
//               doctorName
//             )}&size=80&background=008B8B&color=fff&bold=true" />
//           </div>
//           <div>
//             <h3 class="text-xl font-bold text-gray-900">${doctorName}</h3>
//             <p class="text-gray-600 font-medium">${specialization}</p>
//           </div>
//         </div>

//         <div class="text-center px-6 border-l border-r border-gray-200">
//           <p class="text-2xl font-bold text-gray-900">${formattedDate}</p>
//           <p class="text-gray-600 font-medium">${formattedTime}</p>
//         </div>
//     `;

//     if (appDate >= today && app.status === "scheduled") {
//       // Upcoming appointment
//       cardHTML += `
//         <div class="flex gap-3">
//           <button onclick="openRescheduleModal()" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-all">Reschedule</button>
//           <button onclick="openCancelModal()" class="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-lg transition-all">Cancel</button>
//         </div>`;
//       upcomingSection.appendChild(card);
//     } else {
//       // Past appointment
//       cardHTML += `
//         <div>
//           <span class="${statusClass} text-white font-bold px-8 py-3 rounded-lg text-lg">
//             ${app.status.replace("-", " ")}
//           </span>
//         </div>`;
//       card.dataset.status = app.status;
//       card.classList.add("appointment-card");
//       pastSection.appendChild(card);
//     }

//     card.innerHTML = cardHTML + "</div>";
//   });

//   // Show "Upcoming" by default
//   showUpcoming();
// }

// window.onload = () => {
//   getAppointments();
// };
