AFRAME.registerSystem("game", {
    init() {
      console.log("init game");

      // Single source of truth
      this.state = "playing";   // playing | gameover | win
      this.masked = true;

      // timer in seconds
      this.timeLeft = 3;

      // cache scene for convenience
      this.scene = this.el.sceneEl;

      // initial apply
      this.applyMaskMode();
      this.updateUI();
    },

    // Toggle mask mode
    toggleMask() {
      if (this.state !== "playing") return;
      this.masked = !this.masked;
      this.applyMaskMode();
      this.updateUI();
    },

    // Apply visuals/sounds based on masked state
    applyMaskMode() {
      document.querySelectorAll(".masked").forEach(el =>
        el.setAttribute("visible", this.masked)
      );
      document.querySelectorAll(".unmasked").forEach(el =>
        el.setAttribute("visible", !this.masked)
      );

      // Fog vibe
      this.scene.setAttribute(
        "fog",
        this.masked
          ? "type: linear; color: #111; near: 1; far: 30"
          : "type: linear; color: #330; near: 1; far: 18"
      );

      // Optional audio
      const a1 = document.querySelector("#ambMasked");
      const a2 = document.querySelector("#ambUnmasked");
      if (a1?.components?.sound && a2?.components?.sound) {
        if (this.masked) {
          a1.components.sound.playSound();
          a2.components.sound.stopSound();
        } else {
          a2.components.sound.playSound();
          a1.components.sound.stopSound();
        }
      }
    },

    win() {
      if (this.state !== "playing") return;
      this.state = "win";
      this.updateUI("YOU FOUND THE TRUTH.");
    },

    gameOver() {
      if (this.state !== "playing") return;
      this.state = "gameover";
      this.updateUI("GAME OVER.");
    },

    updateUI(overrideText) {
      const msg = document.querySelector("#msg");
      if (!msg) return;

      const base =
        overrideText ||
        (this.state === "playing"
          ? `TIME: ${Math.ceil(this.timeLeft)}  |  MODE: ${this.masked ? "MASK" : "UNMASKED"}`
          : this.state === "win"
          ? "YOU WIN. (REFRESH TO RESTART)"
          : "GAME OVER. (REFRESH TO RESTART)");

      msg.setAttribute("text", "value", base);
    },

    tick(time, delta) {
      if (this.state !== "playing") return;

      // delta is ms
      this.timeLeft -= delta / 1000;

      // update UI at a reasonable cadence (optional)
      // (simple approach: update every tick is okay for jam UI)
      this.updateUI();

      if (this.timeLeft <= 0) {
        this.gameOver();
      }
    }
  });

  // Component: listens for key and forwards to system
  AFRAME.registerComponent("mask-toggle", {
    init() {
      this.game = this.el.sceneEl.systems.game;

      this.onKeyDown = (e) => {
        if (e.code === "Space") {
          this.game.toggleMask();
        }
      };

      window.addEventListener("keydown", this.onKeyDown);
    },

    remove() {
      window.removeEventListener("keydown", this.onKeyDown);
    }
  });

  // Component: goal trigger
  AFRAME.registerComponent("goal", {
    init() {
      this.game = this.el.sceneEl.systems.game;

      this.el.addEventListener("mouseenter", () => {
        this.game.win();
      });
    }
  });