document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const defaultActivityOption = activitySelect.innerHTML;
  let messageTimeoutId;

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function showMessage(type, text) {
    if (messageTimeoutId) {
      clearTimeout(messageTimeoutId);
    }

    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    messageTimeoutId = window.setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = defaultActivityOption;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup = details.participants.length
          ? details.participants
              .map((participant) => {
                const encodedActivity = encodeURIComponent(name);
                const encodedParticipant = encodeURIComponent(participant);
                const escapedParticipant = escapeHtml(participant);

                return `
                  <li class="participant-item">
                    <span class="participant-email">${escapedParticipant}</span>
                    <button
                      type="button"
                      class="participant-delete-button"
                      data-activity="${encodedActivity}"
                      data-email="${encodedParticipant}"
                      aria-label="Remove ${escapedParticipant} from ${escapeHtml(name)}"
                    >
                      &times;
                    </button>
                  </li>
                `;
              })
              .join("")
          : '<li class="participants-empty">No students signed up yet</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title">Participants</p>
            <ul class="participants-list">
              ${participantsMarkup}
            </ul>
          </div>
        `;

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
        showMessage("success", result.message);
        signupForm.reset();
        fetchActivities();
      } else {
        showMessage("error", result.detail || "An error occurred");
      }
    } catch (error) {
      showMessage("error", "Failed to sign up. Please try again.");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete-button");

    if (!deleteButton) {
      return;
    }

    const activity = deleteButton.dataset.activity;
    const email = deleteButton.dataset.email;

    try {
      deleteButton.disabled = true;

      const response = await fetch(`/activities/${activity}/signup?email=${email}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        showMessage("success", result.message);
        fetchActivities();
      } else {
        showMessage("error", result.detail || "Failed to unregister participant.");
        deleteButton.disabled = false;
      }
    } catch (error) {
      deleteButton.disabled = false;
      showMessage("error", "Failed to unregister participant. Please try again.");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
