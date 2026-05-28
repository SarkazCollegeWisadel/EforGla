/* ════════════════════════════════════════════════
   EforGla V1.6 — Blackboard Surface Manager
   黑板外壳：背景图、尺寸、位置独立管理
   ════════════════════════════════════════════════ */

const Blackboard = {
  dom: null,

  init() {
    this.dom = {
      panel: document.getElementById("blackboard-panel"),
      surface: document.getElementById("blackboard-surface"),
      sceneBgs: document.querySelectorAll(".scene-bg")
    };
    if (!this.dom.panel) {
      console.warn("[Blackboard] #blackboard-panel not found");
      return;
    }
    this.update(App.state.settings);
  },

  update(settings) {
    const s = settings || {};
    this._updateBackground(s);
    this._updateBlackboard(s);
  },

  _updateBackground(s) {
    const bgUrl = s.customBackground || "assets/classroom_bg.png";
    this.dom.sceneBgs.forEach((el) => {
      el.style.backgroundImage = `url("${bgUrl}")`;
    });
  },

  _updateBlackboard(s) {
    const panel = this.dom.panel;
    const surface = this.dom.surface;
    if (!panel) return;

    // Position & size via CSS variables
    const baseLeft = 39.4;
    const baseTop = 15.6;
    const tx = s.blackboardTranslateX || 0;
    const ty = s.blackboardTranslateY || 0;
    const scale = s.blackboardScale || 1;

    panel.style.setProperty("--bb-left", `calc(${baseLeft}vw + ${tx}px)`);
    panel.style.setProperty("--bb-top", `calc(${baseTop}vh + ${ty}px)`);
    panel.style.setProperty("--bb-width", `${s.blackboardSizeW || 49.4}vw`);
    panel.style.setProperty("--bb-height", `${s.blackboardSizeH || 50.5}vh`);
    panel.style.setProperty("--bb-scale", scale);

    // Surface background
    if (surface) {
      if (s.customBlackboard) {
        surface.style.backgroundImage = `url("${s.customBlackboard}")`;
        surface.style.backgroundColor = "transparent";
      } else if (s.blackboardColor) {
        surface.style.backgroundImage = "none";
        surface.style.backgroundColor = s.blackboardColor;
      } else {
        surface.style.backgroundImage = "none";
        surface.style.backgroundColor = "transparent";
      }
    }
  }
};
