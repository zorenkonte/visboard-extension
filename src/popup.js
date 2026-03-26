const LASER_COLOR_KEY = "laserColor";
const DEFAULT_LASER_COLOR = "#ff0000";

const colorInput = document.getElementById("laser-color-input");

function normalizeHexColor(value) {
  if (typeof value !== "string") return DEFAULT_LASER_COLOR;
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULT_LASER_COLOR;
}

async function init() {
  const { [LASER_COLOR_KEY]: savedColor = DEFAULT_LASER_COLOR } = await chrome.storage.local.get({
    [LASER_COLOR_KEY]: DEFAULT_LASER_COLOR,
  });

  colorInput.value = normalizeHexColor(savedColor);
}

colorInput.addEventListener("input", async (event) => {
  const nextColor = normalizeHexColor(event.target.value);
  colorInput.value = nextColor;
  await chrome.storage.local.set({ [LASER_COLOR_KEY]: nextColor });
});

init();
