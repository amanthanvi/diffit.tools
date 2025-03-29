/**
 * Diff Column Resizer
 * A lightweight solution for resizable diff view columns
 */
document.addEventListener("DOMContentLoaded", function () {
	setTimeout(initDiffResizer, 300);
});

function initDiffResizer() {
	console.log("Initializing diff resizer");

	const diffContainers = document.querySelectorAll(".diff-container");
	if (!diffContainers.length) {
		console.log("No diff containers found");
		return;
	}

	diffContainers.forEach(setupDiffContainer);

	console.log("Diff resizer initialization complete");
}

function setupDiffContainer(diffContainer) {
	const tables = diffContainer.querySelectorAll("table");
	console.log(`Found ${tables.length} tables in diff container`);

	if (tables.length === 0) return;

	let resizer = diffContainer.querySelector(".column-resizer");

	if (!resizer) {
		resizer = document.createElement("div");
		resizer.className = "column-resizer";

		const grip = document.createElement("div");
		grip.className = "grip-indicator";
		resizer.appendChild(grip);

		diffContainer.appendChild(resizer);
	}

	resizer.style.display = "block";

	setupTableColumns(tables);

	const initialPosition = 0.5;
	setColumnWidths(diffContainer, initialPosition);
	positionResizer(diffContainer, resizer, initialPosition);
	setupResizeEvents(diffContainer, resizer);
}

function setupTableColumns(tables) {
	tables.forEach((table) => {
		table.classList.add("resizable-diff-table");

		const firstRow = table.querySelector("tr");
		if (!firstRow) return;

		const cells = firstRow.querySelectorAll("td, th");
		const cellCount = cells.length;
		if (cellCount < 2) return;

		let colgroup = table.querySelector("colgroup");
		if (!colgroup) {
			colgroup = document.createElement("colgroup");

			for (let i = 0; i < cellCount; i++) {
				const col = document.createElement("col");
				if (
					(cellCount === 4 && (i === 1 || i === 3)) ||
					(cellCount === 2 && i === 1)
				) {
					col.className = "content-column";
				} else {
					col.className = "line-number-column";
					col.style.width = "40px";
				}
				colgroup.appendChild(col);
			}

			table.insertBefore(colgroup, table.firstChild);
		}
	});
}

function setColumnWidths(container, position) {
	// FIXED: Set CSS variables on the container instead of the table
	container.style.setProperty("--left-pane-width", `${position * 100}%`);
	container.style.setProperty(
		"--right-pane-width",
		`${(1 - position) * 100}%`
	);
}

function positionResizer(container, resizer, position) {
	const containerRect = container.getBoundingClientRect();

	// FIXED: Set position using percentages without transform
	resizer.style.left = `${position * 100}%`;
	resizer.style.height = `${containerRect.height}px`;
	// FIXED: Removed the transform that was causing positioning issues
	resizer.style.transform = "";
}

function setupResizeEvents(container, resizer) {
	const newResizer = resizer.cloneNode(true);
	resizer.parentNode.replaceChild(newResizer, resizer);
	resizer = newResizer;

	let isResizing = false;

	function startResize(e) {
		e.preventDefault();
		isResizing = true;
		document.body.classList.add("resizing");
		resizer.classList.add("resizing");
		container.classList.add("resizing-active");
	}

	function performResize(e) {
		if (!isResizing) return;
		e.preventDefault();

		const clientX = e.type.includes("touch")
			? e.touches[0].clientX
			: e.clientX;
		const containerRect = container.getBoundingClientRect();
		let position = (clientX - containerRect.left) / containerRect.width;
		position = Math.max(0.1, Math.min(position, 0.9));

		setColumnWidths(container, position);
		positionResizer(container, resizer, position);
	}

	function endResize() {
		if (!isResizing) return;
		isResizing = false;
		document.body.classList.remove("resizing");
		resizer.classList.remove("resizing");
		container.classList.remove("resizing-active");
	}

	resizer.addEventListener("mousedown", startResize);
	document.addEventListener("mousemove", performResize);
	document.addEventListener("mouseup", endResize);

	resizer.addEventListener("touchstart", startResize, { passive: false });
	document.addEventListener("touchmove", performResize, { passive: false });
	document.addEventListener("touchend", endResize);
	document.addEventListener("touchcancel", endResize);
}

let windowResizeTimer;
window.addEventListener("resize", function () {
	clearTimeout(windowResizeTimer);
	windowResizeTimer = setTimeout(() => {
		const containers = document.querySelectorAll(".diff-container");
		containers.forEach((container) => {
			const resizer = container.querySelector(".column-resizer");
			if (resizer) {
				// Get position from the container's CSS variables
				const leftWidth =
					container.style.getPropertyValue("--left-pane-width") ||
					"50%";
				const position = parseFloat(leftWidth) / 100;
				const containerRect = container.getBoundingClientRect();
				resizer.style.height = `${containerRect.height}px`;
				resizer.style.left = `${position * 100}%`;
			}
		});
	}, 250);
});

let contentObserver;
if (window.MutationObserver) {
	contentObserver = new MutationObserver((mutationsList) => {
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				let needsInit = false;
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						if (
							node.classList?.contains("diff-container") ||
							node.querySelector?.(".diff-container")
						) {
							needsInit = true;
						}
					}
				});
				if (needsInit) {
					console.log(
						"Dynamic content change detected, re-initializing resizer"
					);
					setTimeout(initDiffResizer, 250);
					break;
				}
			}
		}
	});

	contentObserver.observe(document.body, {
		childList: true,
		subtree: true,
	});
}
