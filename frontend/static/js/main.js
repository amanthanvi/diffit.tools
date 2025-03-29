document.addEventListener("DOMContentLoaded", function () {
	// Dark mode toggle functionality
	const darkModeToggle = document.getElementById("darkModeToggle");
	const body = document.body;

	// Check for saved preference
	const darkMode = localStorage.getItem("darkMode") === "enabled";

	// Set initial mode
	if (darkMode) {
		enableDarkMode();
	} else {
		enableLightMode();
	}

	darkModeToggle.addEventListener("click", function () {
		// Toggle dark mode
		if (body.classList.contains("dark-mode")) {
			enableLightMode();
		} else {
			enableDarkMode();
		}
	});

	// Function to enable dark mode
	function enableDarkMode() {
		body.classList.add("dark-mode");
		body.classList.remove("light-mode");
		document.documentElement.setAttribute("data-theme", "dark");
		localStorage.setItem("darkMode", "enabled");
		updateToggleButton(true);
	}

	// Function to enable light mode
	function enableLightMode() {
		body.classList.remove("dark-mode");
		body.classList.add("light-mode");
		document.documentElement.setAttribute("data-theme", "light");
		localStorage.setItem("darkMode", "disabled");
		updateToggleButton(false);
	}

	// Function to update toggle button appearance
	function updateToggleButton(isDarkMode) {
		if (isDarkMode) {
			darkModeToggle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sun" viewBox="0 0 16 16">
                    <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
                </svg>
                <span>Light Mode</span>
            `;
			darkModeToggle.classList.remove("btn-outline-dark");
			darkModeToggle.classList.add("btn-outline-light");
		} else {
			darkModeToggle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-moon" viewBox="0 0 16 16">
                    <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
                </svg>
                <span>Dark Mode</span>
            `;
			darkModeToggle.classList.remove("btn-outline-light");
			darkModeToggle.classList.add("btn-outline-dark");
		}
	}

	// Copy share link functionality
	const copyShareUrlBtn = document.getElementById("copyShareUrl");
	if (copyShareUrlBtn) {
		copyShareUrlBtn.addEventListener("click", function () {
			const shareUrl = window.location.origin + this.dataset.shareUrl;

			// Copy to clipboard
			navigator.clipboard
				.writeText(shareUrl)
				.then(function () {
					// Change button text temporarily
					const originalText = copyShareUrlBtn.innerHTML;
					copyShareUrlBtn.innerHTML = "<span>Copied!</span>";

					// Reset after 2 seconds
					setTimeout(function () {
						copyShareUrlBtn.innerHTML = originalText;
					}, 2000);
				})
				.catch(function (err) {
					console.error("Failed to copy: ", err);
					alert("Failed to copy URL: " + err);
				});
		});
	}
});
