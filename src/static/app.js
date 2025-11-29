document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API and render them
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Build participants area using DOM so we can attach listeners to delete buttons
        const participantsDiv = document.createElement('div');
        participantsDiv.className = 'participants';

        if (details.participants && details.participants.length) {
          const header = document.createElement('p');
          header.innerHTML = '<strong>Participants:</strong>';
          participantsDiv.appendChild(header);

          const ul = document.createElement('ul');

          details.participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = p;
            nameSpan.className = 'participant-email';

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-participant';
            delBtn.setAttribute('aria-label', `Remove ${p}`);
            delBtn.title = 'Unregister participant';
            delBtn.textContent = '✖';
            // Attach data for handler
            delBtn.dataset.activity = name;
            delBtn.dataset.email = p;

            // Click handler to unregister participant
            delBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              // Confirm before removing
              const confirmed = confirm(`Unregister ${p} from ${name}?`);
              if (!confirmed) return;

              try {
                const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, { method: 'DELETE' });
                const json = await res.json().catch(() => ({}));
                if (res.ok) {
                  messageDiv.textContent = json.message || 'Participant removed';
                  messageDiv.className = 'success';
                  fetchActivities();
                } else {
                  messageDiv.textContent = json.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                }
              } catch (err) {
                messageDiv.textContent = 'Failed to remove participant. Please try again.';
                messageDiv.className = 'error';
                console.error('Error removing participant:', err);
              }

              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 5000);
            });

            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
        } else {
          const pEmpty = document.createElement('p');
          pEmpty.className = 'no-participants';
          pEmpty.innerHTML = '<em>No participants yet</em>';
          participantsDiv.appendChild(pEmpty);
        }

        activityCard.appendChild(participantsDiv);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
