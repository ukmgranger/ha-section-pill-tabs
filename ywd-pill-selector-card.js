import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";

// ============================================================================
// 1. THE PILL SELECTOR CARD (With Font Weights)
// ============================================================================

class YWDPillSelectorEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
    };
  }

  setConfig(config) {
    let tabs = config.tabs || [];
    if (tabs.length === 0 && config.label_1) {
      tabs = [
        { label: config.label_1, target: config.target_1 || config.label_1 },
        { label: config.label_2, target: config.target_2 || config.label_2 }
      ];
    } else if (tabs.length === 0) {
      tabs = [
        { label: "Downstairs", target: "Downstairs" },
        { label: "Upstairs", target: "Upstairs" }
      ];
    }
    this._config = { ...config, tabs };
  }

  _fireConfig(newConfig) {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    }));
  }

  _valueChanged(ev) {
    if (!this._config) return;
    this._fireConfig({ ...this._config, [ev.target.configValue]: ev.target.value });
  }

  _updateTab(index, field, value) {
    const tabs = [...this._config.tabs];
    tabs[index] = { ...tabs[index], [field]: value };
    this._fireConfig({ ...this._config, tabs });
  }

  _addTab() {
    const tabs = [...this._config.tabs, { label: "New Room", target: "New Room" }];
    this._fireConfig({ ...this._config, tabs });
  }

  _removeTab(index) {
    const tabs = [...this._config.tabs];
    tabs.splice(index, 1);
    this._fireConfig({ ...this._config, tabs });
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const tabs = this._config.tabs || [];

    return html`
      <div style="padding: 10px;">
        <h3 style="margin-top: 0;">Pill Options</h3>
        ${tabs.map((tab, index) => html`
          <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center; border-left: 2px solid var(--primary-color); padding-left: 10px;">
            <div style="flex: 1;">
              <ha-textfield
                label="Button Label"
                .value=${tab.label}
                @input=${(e) => this._updateTab(index, "label", e.target.value)}
                style="width: 100%; margin-bottom: 4px;"
              ></ha-textfield>

              <ha-textfield
                label="Target Room Name"
                .value=${tab.target}
                @input=${(e) => this._updateTab(index, "target", e.target.value)}
                style="width: 100%;"
              ></ha-textfield>
            </div>

            <ha-icon-button
              .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
              @click=${() => this._removeTab(index)}
              title="Remove"
            ></ha-icon-button>
          </div>
        `)}

        <mwc-button @click=${this._addTab} style="margin-bottom: 20px;">
          + Add Another Option
        </mwc-button>

        <h3 style="margin-top: 10px;">Style</h3>

        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <ha-textfield
            label="Border Radius"
            .value=${this._config.border_radius || "14px"}
            .configValue=${"border_radius"}
            @input=${this._valueChanged}
            style="flex: 1;"
          ></ha-textfield>

          <ha-textfield
            label="Font Size"
            .value=${this._config.font_size || "14px"}
            .configValue=${"font_size"}
            @input=${this._valueChanged}
            style="flex: 1;"
          ></ha-textfield>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <ha-textfield
            label="Font Weight"
            .value=${this._config.font_weight || "600"}
            .configValue=${"font_weight"}
            @input=${this._valueChanged}
            style="flex: 1;"
          ></ha-textfield>

          <ha-textfield
            label="Active Font Weight"
            .value=${this._config.active_font_weight || "700"}
            .configValue=${"active_font_weight"}
            @input=${this._valueChanged}
            style="flex: 1;"
          ></ha-textfield>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <ha-textfield
            label="Active Text Color"
            .value=${this._config.active_color || "#5ec9c9"}
            .configValue=${"active_color"}
            @input=${this._valueChanged}
            style="flex: 1;"
          ></ha-textfield>

          <ha-textfield
            label="Container Background"
            .value=${this._config.container_bg_color || "#1a1a1a"}
            .configValue=${"container_bg_color"}
            @input=${this._valueChanged}
            style="flex: 1;"
          ></ha-textfield>
        </div>
      </div>
    `;
  }
}
customElements.define("ywd-pill-selector-editor", YWDPillSelectorEditor);

class YWDPillSelectorCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
      _selectedTarget: { type: String },

      _dragging: { type: Boolean },
      _dragIndex: { type: Number },
      _activeIndex: { type: Number },
    };
  }

  constructor() {
    super();
    this._selectedTarget = localStorage.getItem("ywd_local_pill_target") || "";
    this._syncListener = () => this._broadcastState();

    this._dragging = false;
    this._dragIndex = 0;
    this._activeIndex = 0;

    this._pointerId = null;
    this._startX = 0;
    this._startIndex = 0;
    this._containerRect = null;
    this._didDrag = false;
  }

  setConfig(config) {
    let tabs = config.tabs || [];
    if (tabs.length === 0 && config.label_1) {
      tabs = [
        { label: config.label_1, target: config.target_1 || config.label_1 },
        { label: config.label_2, target: config.target_2 || config.label_2 }
      ];
    } else if (tabs.length === 0) {
      tabs = [
        { label: "Downstairs", target: "Downstairs" },
        { label: "Upstairs", target: "Upstairs" }
      ];
    }
    this._config = { ...config, tabs };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("ywd-request-sync", this._syncListener);
    window.addEventListener("location-changed", this._syncListener);

    const tabs = this._config?.tabs || [];
    const savedIndex = tabs.findIndex(
      (t) => t.target.trim().toLowerCase() === this._selectedTarget
    );

    if (savedIndex === -1) {
      this._selectedTarget = tabs[0]?.target.trim().toLowerCase() || "";
      this._activeIndex = 0;
    } else {
      this._activeIndex = savedIndex;
    }

    setTimeout(this._syncListener, 50);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("ywd-request-sync", this._syncListener);
    window.removeEventListener("location-changed", this._syncListener);
  }

  _selectOption(targetStr) {
    const cleanTarget = targetStr.trim().toLowerCase();
    const tabs = this._config.tabs || [];
    const newIndex = tabs.findIndex(
      (t) => t.target.trim().toLowerCase() === cleanTarget
    );

    if (this._selectedTarget === cleanTarget && this._activeIndex === newIndex) return;

    this._selectedTarget = cleanTarget;
    this._activeIndex = newIndex >= 0 ? newIndex : 0;
    this._dragIndex = this._activeIndex;

    localStorage.setItem("ywd_local_pill_target", this._selectedTarget);

    if (navigator.vibrate) navigator.vibrate(30);

    this._broadcastState();
    this.requestUpdate();
  }

  _broadcastState() {
    window.dispatchEvent(new CustomEvent("ywd-section-toggle", {
      detail: { activeRoom: this._selectedTarget }
    }));
  }

  _getTabs() {
    return this._config?.tabs || [];
  }

  _getActiveIndex() {
    const tabs = this._getTabs();
    const idx = tabs.findIndex(
      (t) => t.target.trim().toLowerCase() === this._selectedTarget
    );
    return idx >= 0 ? idx : 0;
  }

  _handlePointerDown(e) {
    const tabs = this._getTabs();
    if (!tabs.length) return;

    const container = e.currentTarget;
    this._containerRect = container.getBoundingClientRect();
    this._pointerId = e.pointerId;
    this._startX = e.clientX;
    this._startIndex = this._getActiveIndex();
    this._activeIndex = this._startIndex;
    this._dragIndex = this._startIndex;
    this._dragging = true;
    this._didDrag = false;

    if (container.setPointerCapture) {
      container.setPointerCapture(e.pointerId);
    }
  }

  _handlePointerMove(e) {
    if (!this._dragging || e.pointerId !== this._pointerId || !this._containerRect) return;

    const tabs = this._getTabs();
    if (!tabs.length) return;

    const tabWidth = this._containerRect.width / tabs.length;
    const deltaX = e.clientX - this._startX;

    if (Math.abs(deltaX) > 6) {
      this._didDrag = true;
    }

    let dragIndex = this._startIndex + (deltaX / tabWidth);
    dragIndex = Math.max(0, Math.min(tabs.length - 1, dragIndex));

    this._dragIndex = dragIndex;
    this.requestUpdate();
  }

  _handlePointerEnd(e) {
    if (!this._dragging || e.pointerId !== this._pointerId) return;

    const tabs = this._getTabs();
    const container = e.currentTarget;

    if (container.releasePointerCapture) {
      try {
        container.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    let finalIndex;

    if (this._didDrag) {
      finalIndex = Math.round(this._dragIndex);
    } else {
      if (this._containerRect && tabs.length) {
        const relativeX = e.clientX - this._containerRect.left;
        const tabWidth = this._containerRect.width / tabs.length;
        finalIndex = Math.max(
          0,
          Math.min(tabs.length - 1, Math.floor(relativeX / tabWidth))
        );
      } else {
        finalIndex = this._startIndex;
      }
    }

    finalIndex = Math.max(0, Math.min(tabs.length - 1, finalIndex));

    this._dragging = false;
    this._pointerId = null;
    this._containerRect = null;
    this._didDrag = false;

    if (tabs[finalIndex]) {
      this._selectOption(tabs[finalIndex].target);
    } else {
      this._dragIndex = this._activeIndex;
      this.requestUpdate();
    }
  }

  _handleButtonClick(tab, index, e) {
    if (this._didDrag) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this._selectOption(tab.target);
  }

  render() {
    if (!this._config) return html``;

    const tabs = this._config.tabs || [];
    const activeColor = this._config.active_color || "#5ec9c9";
    const containerBg = this._config.container_bg_color || "#1a1a1a";
    
    // Configurable Styling Variables
    const borderRadius = this._config.border_radius || "14px";
    const fontSize = this._config.font_size || "14px";
    const fontWeight = this._config.font_weight || "600";
    const activeFontWeight = this._config.active_font_weight || "700";

    let activeIndex = tabs.findIndex(
      (t) => t.target.trim().toLowerCase() === this._selectedTarget
    );
    if (activeIndex === -1) activeIndex = 0;

    const visualIndex = this._dragging ? this._dragIndex : activeIndex;

    return html`
      <ha-card>
        <div
          class="pill-container"
          style="
            background: ${containerBg};
            --tab-count: ${tabs.length};
            --active-index: ${visualIndex};
            --custom-radius: ${borderRadius};
            --custom-font-size: ${fontSize};
            --custom-font-weight: ${fontWeight};
            --custom-active-font-weight: ${activeFontWeight};
          "
          @pointerdown=${this._handlePointerDown}
          @pointermove=${this._handlePointerMove}
          @pointerup=${this._handlePointerEnd}
          @pointercancel=${this._handlePointerEnd}
        >
          <div class="sliding-bg ${this._dragging ? "dragging" : ""}"></div>

          ${tabs.map((tab, index) => {
            const isActive = index === Math.round(visualIndex);
            return html`
              <div
                class="pill-button ${isActive ? "active" : ""}"
                @click=${(e) => this._handleButtonClick(tab, index, e)}
                style="color: ${isActive ? activeColor : "#808080"};"
              >
                ${tab.label}
              </div>
            `;
          })}
        </div>
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        background: none;
        border: none;
        box-shadow: none;
      }

      .pill-container {
        position: relative;
        display: flex;
        border-radius: var(--custom-radius);
        padding: 4px;
        touch-action: pan-y;
        user-select: none;
        -webkit-user-select: none;
        overflow: hidden;
      }

      .sliding-bg {
        position: absolute;
        top: 4px;
        bottom: 4px;
        left: 4px;
        width: calc((100% - 8px) / var(--tab-count));
        transform: translateX(calc(100% * var(--active-index)));
        background: rgba(255, 255, 255, 0.1);
        
        border-radius: calc(var(--custom-radius) - 4px);
        
        transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
        pointer-events: none;
        will-change: transform;
      }

      .sliding-bg.dragging {
        transition: none;
      }

      .pill-button {
        position: relative;
        z-index: 1;
        flex: 1;
        text-align: center;
        padding: 12px 8px;
        
        border-radius: calc(var(--custom-radius) - 4px);
        
        cursor: pointer;
        font-size: var(--custom-font-size);
        font-weight: var(--custom-font-weight);
        transition: color 0.2s ease, font-weight 0.2s ease;
      }

      .active {
        font-weight: var(--custom-active-font-weight);
      }
    `;
  }

  static getConfigElement() {
    return document.createElement("ywd-pill-selector-editor");
  }
}
customElements.define("ywd-pill-selector-card", YWDPillSelectorCard);

// ============================================================================
// 2. THE ANCHOR CARD (Unchanged)
// ============================================================================

class YWDAnchorEditor extends LitElement {
  static get properties() { return { hass: { type: Object }, _config: { type: Object } }; }
  setConfig(config) { this._config = config; }

  _valueChanged(ev) {
    if (!this._config || !this.hass) return;
    const newConfig = { ...this._config, [ev.target.configValue]: ev.target.value };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: newConfig }, bubbles: true, composed: true }));
  }

  render() {
    if (!this.hass || !this._config) return html``;
    return html`
      <div style="padding: 10px;">
        <ha-textfield label="Target Room Name (e.g. Downstairs)" .value=${this._config.target_room || ""} .configValue=${"target_room"} @input=${this._valueChanged} style="width: 100%;"></ha-textfield>
      </div>
    `;
  }
}
customElements.define("ywd-anchor-editor", YWDAnchorEditor);

class YWDAnchorCard extends LitElement {
  static get properties() { return { _config: { type: Object }, editMode: { type: Boolean } }; }

  constructor() {
    super();
    this._lastRoom = "";
    this._lastEditMode = false;
    this._pillListener = (e) => { this._lastRoom = e.detail.activeRoom; this._applyVisibility(); };
    this._locListener = () => this._applyVisibility();
  }

  setConfig(config) { this._config = config; }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("ywd-section-toggle", this._pillListener);
    window.addEventListener("location-changed", this._locListener);
    window.addEventListener("popstate", this._locListener);
    setTimeout(() => { window.dispatchEvent(new Event("ywd-request-sync")); }, 50);
    setTimeout(() => { this._applyVisibility(); }, 100);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("ywd-section-toggle", this._pillListener);
    window.removeEventListener("location-changed", this._locListener);
    window.removeEventListener("popstate", this._locListener);
  }

  get _isEditMode() {
    if (this.editMode === true) return true;
    if (window.location.pathname.endsWith("/edit") || window.location.search.includes("edit=")) return true;
    let node = this;
    while (node) {
      if (node.tagName === "HUI-CARD-OPTIONS" || node.editMode) return true;
      node = node.parentNode || node.host;
    }
    return false;
  }

  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("editMode")) this._applyVisibility();
  }

  _findParentHuiSection() {
    let node = this;
    while (node) {
      if (node.tagName === "HUI-SECTION") return node;
      node = node.parentNode || node.host;
    }
    return null;
  }

  _findSectionWrapper(huiSection) {
    if (!huiSection) return null;
    let node = huiSection;
    while (node) {
      if (node.classList && node.classList.contains("section")) return node;
      node = node.parentNode || node.host;
    }
    return null;
  }

  _forceRelayout() {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("ywd-force-layout"));
    });
    setTimeout(() => { window.dispatchEvent(new Event("resize")); }, 50);
  }

  _applyVisibility() {
    const huiSection = this._findParentHuiSection();
    if (!huiSection) return;
    const sectionWrapper = this._findSectionWrapper(huiSection);

    const isEdit = this._isEditMode;
    const myRoom = (this._config?.target_room || "").trim().toLowerCase();
    const active = (this._lastRoom || "").trim().toLowerCase();
    const shouldShow = isEdit || myRoom === active;

    if (shouldShow) {
      huiSection.hidden = false;
      huiSection.style.display = "";
      huiSection.style.visibility = "";
      huiSection.style.height = "";
      huiSection.style.minHeight = "";
      huiSection.style.margin = "";
      huiSection.style.padding = "";
      huiSection.style.pointerEvents = "";

      if (sectionWrapper) {
        sectionWrapper.hidden = false;
        sectionWrapper.style.display = "";
        sectionWrapper.style.visibility = "";
        sectionWrapper.style.height = "";
        sectionWrapper.style.minHeight = "";
        sectionWrapper.style.margin = "";
        sectionWrapper.style.padding = "";
        sectionWrapper.style.pointerEvents = "";
      }
      this.style.display = isEdit ? "" : "none";
    } else {
      this.style.display = "none";
      huiSection.hidden = true;
      huiSection.style.display = "none";
      huiSection.style.visibility = "hidden";
      huiSection.style.height = "0";
      huiSection.style.minHeight = "0";
      huiSection.style.margin = "0";
      huiSection.style.padding = "0";
      huiSection.style.pointerEvents = "none";

      if (sectionWrapper) {
        sectionWrapper.hidden = true;
        sectionWrapper.style.display = "none";
        sectionWrapper.style.visibility = "hidden";
        sectionWrapper.style.height = "0";
        sectionWrapper.style.minHeight = "0";
        sectionWrapper.style.margin = "0";
        sectionWrapper.style.padding = "0";
        sectionWrapper.style.pointerEvents = "none";
      }
    }

    if (this._lastEditMode !== isEdit) {
      this._lastEditMode = isEdit;
      this.requestUpdate();
    }
    this._forceRelayout();
  }

  render() {
    if (!this._lastEditMode) return html``;
    return html`
      <ha-card style="border: 2px dashed var(--primary-color); background: rgba(var(--rgb-primary-color), 0.1); padding: 12px; text-align: center; font-weight: bold; color: var(--primary-text-color); box-shadow: none;">
        ⚓ Anchor: ${this._config?.target_room || "Unconfigured"}
      </ha-card>
    `;
  }

  static getConfigElement() { return document.createElement("ywd-anchor-editor"); }
}
customElements.define("ywd-anchor-card", YWDAnchorCard);

window.customCards = window.customCards || [];
window.customCards.push({ type: "ywd-pill-selector-card", name: "YWD Pill Selector", description: "The local pill toggle buttons." });
window.customCards.push({ type: "ywd-anchor-card", name: "YWD Section Anchor", description: "Drop this inside a section to link it to a Pill Selector." });
