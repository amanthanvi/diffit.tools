document.addEventListener("DOMContentLoaded", function () {
	// Delay initialization slightly to ensure DOM is fully rendered
	setTimeout(initResizer, 500);
});

function initResizer() {
	console.log("Initializing diff resizer");
	const diffContainer = document.querySelector(".diff-container");
	if (!diffContainer) {
		console.log("No diff container found");
		return;
	}

	// Remove any existing resizers
	const existingResizer = diffContainer.querySelector(".column-resizer");
	if (existingResizer) {
		existingResizer.remove();
	}

	// Create resizer element
	const resizer = document.createElement("div");
	resizer.className = "column-resizer";
	diffContainer.appendChild(resizer);

	// Add grip indicator for better visibility
	const grip = document.createElement("div");
	grip.className = "grip-indicator";
	resizer.appendChild(grip);

	// Get all tables in the diff container
	const tables = diffContainer.querySelectorAll("table");
	console.log(`Found ${tables.length} tables in diff container`);

	if (tables.length === 0) {
		console.log("No tables found, hiding resizer");
		resizer.style.display = "none";
		return;
	}

	// Set up the table structure if necessary
	setupTableStructure(tables);

	// Position resizer in the middle initially
	updateResizerPosition(0.5);

	// Variables for tracking resize state
	let isResizing = false;
	let startX = 0;
	let startPercentage = 0.5;

	// Attach event listeners
	resizer.addEventListener("mousedown", startResize);
	document.addEventListener("mousemove", resize);
	document.addEventListener("mouseup", stopResize);

	function setupTableStructure(tables) {
		tables.forEach((table) => {
			// Make sure table has a colgroup for proper column control
			if (!table.querySelector("colgroup")) {
				const firstRow = table.querySelector("tr");
				if (!firstRow) return;

				const cellCount = firstRow.querySelectorAll("td, th").length;
				if (cellCount < 2) return;

				// Create colgroup with appropriate number of columns
				const colgroup = document.createElement("colgroup");

				// Typical diff table has 4 columns: line#, content, line#, content
				for (let i = 0; i < cellCount; i++) {
					const col = document.createElement("col");

					// Mark content columns (typically indices 1 and 3 in a 4-column layout)
					if (
						(cellCount === 4 && (i === 1 || i === 3)) ||
						(cellCount === 2 && i === 1)
					) {
						col.className = "content-column";
					} else {
						col.className = "line-number-column";
						col.style.width = "40px"; // Fixed width for line number columns
					}

					colgroup.appendChild(col);
				}

				// Insert at the beginning of the table
				table.insertBefore(colgroup, table.firstChild);
			}

			// Add special class to the table for our CSS
			table.classList.add("resizable-diff-table");
		});
	}

	function getContainerRect() {
		return diffContainer.getBoundingClientRect();
	}

	function updateResizerPosition(percentage) {
		const containerRect = getContainerRect();
		const position = containerRect.width * percentage;
		resizer.style.left = position + "px";
		resizer.style.height = containerRect.height + "px";
	}

	function startResize(e) {
		console.log("Resize started");
		isResizing = true;
		startX = e.clientX;

		const containerRect = getContainerRect();
		startPercentage =
			parseInt(resizer.style.left) / containerRect.width || 0.5;

		// Add visual feedback
		resizer.classList.add("resizing");
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
		e.preventDefault();
	}

	function resize(e) {
		if (!isResizing) return;

		const containerRect = getContainerRect();

		// Calculate new position as percentage
		const dx = e.clientX - startX;
		const deltaPercentage = dx / containerRect.width;
		let newPercentage = startPercentage + deltaPercentage;

		// Constrain within container
		newPercentage = Math.max(0.2, Math.min(newPercentage, 0.8));

		// Update resizer position
		updateResizerPosition(newPercentage);

		// Adjust table columns
		adjustTableColumns(tables, newPercentage);

		// Set a custom property on the container that can be used in CSS
		diffContainer.style.setProperty(
			"--left-pane-width",
			`${newPercentage * 100}%`
		);
		diffContainer.style.setProperty(
			"--right-pane-width",
			`${(1 - newPercentage) * 100}%`
		);

		e.preventDefault();
	}

	function stopResize() {
		if (!isResizing) return;

		console.log("Resize stopped");
		isResizing = false;
		resizer.classList.remove("resizing");
		document.body.style.cursor = "";
		document.body.style.userSelect = "";
	}

	function adjustTableColumns(tables, percentage) {
		tables.forEach((table) => {
			// Get content columns (skipping line number columns)
			const contentCols = table.querySelectorAll(
				"colgroup .content-column"
			);
			if (contentCols.length >= 2) {
				// Typical case with separate left/right content columns
				const leftCol = contentCols[0];
				const rightCol = contentCols[contentCols.length - 1];

				leftCol.style.width = `${percentage * 100}%`;
				rightCol.style.width = `${(1 - percentage) * 100}%`;
			} else if (contentCols.length === 1) {
				// Single content column case
				contentCols[0].style.width = `${percentage * 100}%`;
			} else {
				// Fallback to cell-based approach if no colgroup structure
				const rows = table.querySelectorAll("tr");
				rows.forEach((row) => {
					const cells = row.querySelectorAll("td, th");
					if (cells.length < 2) return;

					// For typical diff layout with 4 columns
					if (cells.length >= 4) {
						// Adjust content cells (typically indices 1 and 3)
						const leftContentCell = cells[1];
						const rightContentCell = cells[3];

						if (
							leftContentCell &&
							!leftContentCell.classList.contains(
								"diff_header"
							) &&
							!leftContentCell.classList.contains("line-number")
						) {
							leftContentCell.style.width = `${
								percentage * 100
							}%`;
						}

						if (
							rightContentCell &&
							!rightContentCell.classList.contains(
								"diff_header"
							) &&
							!rightContentCell.classList.contains("line-number")
						) {
							rightContentCell.style.width = `${
								(1 - percentage) * 100
							}%`;
						}
					}
				});
			}
		});
	}

	// Call once to initialize column widths
	adjustTableColumns(tables, 0.5);

	console.log("Diff resizer initialization complete");
}

// Re-initialize on window resize
window.addEventListener("resize", function () {
	clearTimeout(window.resizeTimer);
	window.resizeTimer = setTimeout(initResizer, 250);
});

// Re-initialize when new content might be loaded
document.addEventListener("DOMNodeInserted", function (e) {
	if (
		e.target.classList &&
		(e.target.classList.contains("diff-container") ||
			(e.target.querySelector &&
				e.target.querySelector(".diff-container")))
	) {
		clearTimeout(window.domChangeTimer);
		window.domChangeTimer = setTimeout(initResizer, 250);
	}
});
