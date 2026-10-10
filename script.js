/* ==========================================================================
   AURELLE Kitchen & Bath — site behaviour (vanilla JavaScript)
   Fictional portfolio concept by Vantorax Studio
   Every feature checks that its elements exist, so each page can include
   only the components it needs.
   ========================================================================== */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $all(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  /* ---------- 1. Mobile navigation ---------- */
  function initNavigation() {
    var toggle = $(".nav-toggle");
    var nav = $("#site-nav");
    if (!toggle || !nav) { return; }
    var mq = window.matchMedia("(max-width: 1200px)");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
    }
    function isOpen() { return toggle.getAttribute("aria-expanded") === "true"; }

    toggle.addEventListener("click", function () { setOpen(!isOpen()); });

    nav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (link && isOpen()) { setOpen(false); }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (isOpen() && !nav.contains(event.target) && !toggle.contains(event.target)) { setOpen(false); }
    });

    function onBreakpointChange() { if (!mq.matches) { setOpen(false); } }
    if (mq.addEventListener) { mq.addEventListener("change", onBreakpointChange); } else if (mq.addListener) { mq.addListener(onBreakpointChange); }
  }

  /* ---------- 2. Active navigation state (fallback if markup lacks it) ---------- */
  function initActiveNav() {
    var links = $all(".nav__link");
    if (!links.length || $(".nav__link[aria-current='page']")) { return; }
    var current = window.location.pathname.split("/").pop() || "index.html";
    links.forEach(function (link) {
      var target = (link.getAttribute("href") || "").split("#")[0];
      if (target === current) { link.setAttribute("aria-current", "page"); }
    });
  }

  /* ---------- 3. Image fallback (graceful failure of external images) ---------- */
  function initImageFallbacks() {
    function markBroken(img) {
      var holder = img.closest(".media, .project-card__btn, .modal__media");
      if (holder) { holder.classList.add("is-broken"); }
      img.setAttribute("data-failed", "true");
    }
    $all("img").forEach(function (img) {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) { markBroken(img); }
      img.addEventListener("error", function () { markBroken(img); });
    });
  }

  /* ---------- 4. Scroll reveal ---------- */
  function initReveal() {
    var items = $all(".reveal");
    if (!items.length) { return; }
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 5. Smooth in-page scrolling ---------- */
  function initSmoothScroll() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest("a[href^='#']");
      if (!link) { return; }
      var id = link.getAttribute("href").slice(1);
      if (!id) { return; }
      var target = document.getElementById(id);
      if (!target) { return; }
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      if (!target.hasAttribute("tabindex")) { target.setAttribute("tabindex", "-1"); }
      target.focus({ preventScroll: true });
      if (history.replaceState) { history.replaceState(null, "", "#" + id); }
    });
  }

  /* ---------- 6. Back to top ---------- */
  function initBackToTop() {
    var button = $(".back-to-top");
    if (!button) { return; }
    function update() { button.classList.toggle("is-visible", window.scrollY > 700); }
    window.addEventListener("scroll", update, { passive: true });
    update();
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
      var skip = $("#main");
      if (skip) { skip.focus({ preventScroll: true }); }
    });
  }

  /* ---------- 7. FAQ accordions ---------- */
  function initAccordions() {
    var triggers = $all(".accordion__trigger");
    if (!triggers.length) { return; }

    function getPanel(trigger) { return document.getElementById(trigger.getAttribute("aria-controls")); }

    function open(trigger, panel) {
      trigger.setAttribute("aria-expanded", "true");
      panel.hidden = false;
      if (prefersReducedMotion) { panel.classList.add("is-open"); return; }
      window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { panel.classList.add("is-open"); }); });
    }
    function close(trigger, panel) {
      trigger.setAttribute("aria-expanded", "false");
      panel.classList.remove("is-open");
      if (prefersReducedMotion) { panel.hidden = true; return; }
      window.setTimeout(function () {
        if (trigger.getAttribute("aria-expanded") === "false") { panel.hidden = true; }
      }, 400);
    }

    triggers.forEach(function (trigger) {
      var panel = getPanel(trigger);
      if (!panel) { return; }
      var startOpen = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(startOpen));
      panel.hidden = !startOpen;
      panel.classList.toggle("is-open", startOpen);

      trigger.addEventListener("click", function () {
        if (trigger.getAttribute("aria-expanded") === "true") { close(trigger, panel); } else { open(trigger, panel); }
      });

      trigger.addEventListener("keydown", function (event) {
        var list = $all(".accordion__trigger", trigger.closest(".faq-layout, main") || document);
        var index = list.indexOf(trigger);
        var next = null;
        if (event.key === "ArrowDown") { next = list[(index + 1) % list.length]; }
        else if (event.key === "ArrowUp") { next = list[(index - 1 + list.length) % list.length]; }
        else if (event.key === "Home") { next = list[0]; }
        else if (event.key === "End") { next = list[list.length - 1]; }
        if (next) { event.preventDefault(); next.focus(); }
      });
    });

    // Open an item if the page was opened with a matching hash
    if (window.location.hash) {
      var hashTrigger = $(window.location.hash + " .accordion__trigger") || document.querySelector(window.location.hash);
      if (hashTrigger && hashTrigger.classList && hashTrigger.classList.contains("accordion__trigger")) {
        var hashPanel = getPanel(hashTrigger);
        if (hashPanel) { open(hashTrigger, hashPanel); }
      }
    }
  }

  /* ---------- 8. Project filters ---------- */
  function initProjectFilters() {
    var buttons = $all(".filter-btn");
    var cards = $all(".project-card");
    if (!buttons.length || !cards.length) { return; }
    var status = $("#filter-status");

    function applyFilter(filter) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = filter === "all" || card.getAttribute("data-category") === filter;
        card.hidden = !match;
        if (match) { shown += 1; }
      });
      buttons.forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-filter") === filter));
      });
      if (status) {
        status.textContent = "Showing " + shown + (shown === 1 ? " illustrative concept" : " illustrative concepts") + (filter === "all" ? "." : " in this category.");
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () { applyFilter(button.getAttribute("data-filter")); });
    });
    applyFilter("all");
  }

  /* ---------- 9. Project detail modal (native <dialog>) ---------- */
  function initProjectModal() {
    var dialog = $("#project-modal");
    var triggers = $all("[data-project]");
    if (!dialog || !triggers.length) { return; }

    var imgEl = $("#modal-image", dialog);
    var titleEl = $("#modal-title", dialog);
    var catEl = $("#modal-category", dialog);
    var descEl = $("#modal-description", dialog);
    var detailsEl = $("#modal-details", dialog);
    var closeBtn = $(".modal__close", dialog);
    var lastTrigger = null;

    function fill(trigger) {
      titleEl.textContent = trigger.getAttribute("data-title") || "";
      catEl.textContent = trigger.getAttribute("data-label") || "";
      descEl.textContent = trigger.getAttribute("data-description") || "";
      imgEl.src = trigger.getAttribute("data-image") || "";
      imgEl.alt = trigger.getAttribute("data-alt") || "";
      var holder = imgEl.closest(".modal__media");
      if (holder) { holder.classList.remove("is-broken"); }

      while (detailsEl.firstChild) { detailsEl.removeChild(detailsEl.firstChild); }
      var pairs = (trigger.getAttribute("data-details") || "").split("|");
      pairs.forEach(function (pair) {
        var parts = pair.split("::");
        if (parts.length !== 2) { return; }
        var dt = document.createElement("dt");
        var dd = document.createElement("dd");
        dt.textContent = parts[0].trim();
        dd.textContent = parts[1].trim();
        detailsEl.appendChild(dt);
        detailsEl.appendChild(dd);
      });
    }

    function openModal(trigger) {
      lastTrigger = trigger;
      fill(trigger);
      if (typeof dialog.showModal === "function") { dialog.showModal(); } else { dialog.setAttribute("open", ""); }
      document.body.style.overflow = "hidden";
      if (closeBtn) { closeBtn.focus(); }
    }

    function closeModal() {
      if (typeof dialog.close === "function" && dialog.open) { dialog.close(); } else { dialog.removeAttribute("open"); onClosed(); }
    }

    function onClosed() {
      document.body.style.overflow = "";
      if (lastTrigger) { lastTrigger.focus(); }
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () { openModal(trigger); });
    });
    if (closeBtn) { closeBtn.addEventListener("click", closeModal); }
    dialog.addEventListener("close", onClosed);
    dialog.addEventListener("click", function (event) { if (event.target === dialog) { closeModal(); } });
    dialog.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && typeof dialog.showModal !== "function") { closeModal(); }
    });
  }

  /* ---------- 10. Contact form: validation + honest demo feedback ---------- */
  function initContactForm() {
    var form = $("#consultation-form");
    if (!form) { return; }
    var statusBox = $("#form-status");
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var phonePattern = /^[0-9+()\-.\s]{7,20}$/;

    function errorElFor(name) { return document.getElementById("error-" + name); }

    function setError(name, message, control) {
      var el = errorElFor(name);
      if (el) { el.textContent = message; el.classList.add("is-visible"); }
      if (control) { control.setAttribute("aria-invalid", "true"); }
    }
    function clearError(name, control) {
      var el = errorElFor(name);
      if (el) { el.textContent = ""; el.classList.remove("is-visible"); }
      if (control) { control.removeAttribute("aria-invalid"); }
    }

    function validateField(name) {
      var errors = [];
      var control = form.elements[name];
      if (!control) { return errors; }
      var value;

      if (name === "contactMethod") {
        var checked = form.querySelector("input[name='contactMethod']:checked");
        var firstRadio = form.querySelector("input[name='contactMethod']");
        if (!checked) { setError(name, "Please choose how you would like to be contacted.", null); errors.push({ name: name, message: "Preferred contact method", control: firstRadio }); }
        else { clearError(name, null); }
        return errors;
      }
      if (name === "privacy") {
        if (!control.checked) { setError(name, "Please acknowledge the privacy note to continue.", control); errors.push({ name: name, message: "Privacy acknowledgment", control: control }); }
        else { clearError(name, control); }
        return errors;
      }

      value = (control.value || "").trim();
      var message = "";
      if (name === "fullName") {
        if (!value) { message = "Please enter your full name."; }
        else if (value.length < 2) { message = "Your name looks too short."; }
      } else if (name === "email") {
        if (!value) { message = "Please enter your email address."; }
        else if (!emailPattern.test(value)) { message = "Please enter a valid email address, such as name@example.com."; }
      } else if (name === "phone") {
        if (value && !phonePattern.test(value)) { message = "Please enter a valid phone number or leave this field empty."; }
      } else if (name === "projectType") {
        if (!value) { message = "Please select a project type."; }
      } else if (name === "timeframe") {
        if (!value) { message = "Please select a desired timeframe."; }
      } else if (name === "details") {
        if (!value) { message = "Please describe your project."; }
        else if (value.length < 20) { message = "Please add a little more detail (at least 20 characters)."; }
      }

      if (message) {
        setError(name, message, control);
        var labels = { fullName: "Full name", email: "Email address", phone: "Phone number", projectType: "Project type", timeframe: "Desired timeframe", details: "Project details" };
        errors.push({ name: name, message: labels[name] + ": " + message, control: control });
      } else {
        clearError(name, control);
      }
      return errors;
    }

    var fieldNames = ["fullName", "email", "phone", "projectType", "contactMethod", "timeframe", "details", "privacy"];

    function showStatus(kind, titleText, paragraphs, list) {
      if (!statusBox) { return; }
      while (statusBox.firstChild) { statusBox.removeChild(statusBox.firstChild); }
      statusBox.className = "form-status is-visible " + (kind === "error" ? "form-status--error" : "form-status--demo");
      var title = document.createElement("strong");
      title.textContent = titleText;
      statusBox.appendChild(title);
      (paragraphs || []).forEach(function (text) {
        var p = document.createElement("p");
        p.textContent = text;
        statusBox.appendChild(p);
      });
      if (list && list.length) {
        var ul = document.createElement("ul");
        list.forEach(function (item) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.href = "#";
          a.textContent = item.message;
          a.addEventListener("click", function (event) {
            event.preventDefault();
            if (item.control) { item.control.focus(); }
          });
          li.appendChild(a);
          ul.appendChild(li);
        });
        statusBox.appendChild(ul);
      }
      statusBox.setAttribute("tabindex", "-1");
      statusBox.focus();
    }

    // Live validation after a field has been touched
    fieldNames.forEach(function (name) {
      var controls = form.querySelectorAll("[name='" + name + "']");
      Array.prototype.forEach.call(controls, function (control) {
        var evt = (control.type === "radio" || control.type === "checkbox" || control.tagName === "SELECT") ? "change" : "blur";
        control.addEventListener(evt, function () { validateField(name); });
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var allErrors = [];
      fieldNames.forEach(function (name) { allErrors = allErrors.concat(validateField(name)); });

      if (allErrors.length) {
        showStatus("error", "Please check " + allErrors.length + (allErrors.length === 1 ? " field" : " fields") + " before continuing.", ["Nothing has been submitted or stored."], allErrors);
        return;
      }

      // Static portfolio demo: nothing is transmitted, stored or emailed.
      showStatus("demo", "Form checked — demonstration only", [
        "Thank you for trying the form. Your entries are valid, but this is a static portfolio demonstration: no message has been sent, and nothing has been stored or transmitted anywhere.",
        "AURELLE is a fictional concept, so there is no business to receive this inquiry. A real business owner would connect this form to a form provider or a backend service."
      ]);
    });

    form.addEventListener("reset", function () {
      fieldNames.forEach(function (name) {
        var control = form.elements[name];
        clearError(name, (name === "contactMethod") ? null : control);
      });
      if (statusBox) { statusBox.className = "form-status"; while (statusBox.firstChild) { statusBox.removeChild(statusBox.firstChild); } }
    });
  }

  /* ---------- 11. Footer year ---------- */
  function initYear() {
    $all("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  /* ---------- Boot ---------- */
  function init() {
    initNavigation();
    initActiveNav();
    initImageFallbacks();
    initReveal();
    initSmoothScroll();
    initBackToTop();
    initAccordions();
    initProjectFilters();
    initProjectModal();
    initContactForm();
    initYear();
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { init(); }
})();
