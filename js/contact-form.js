const form = document.getElementById("contact-form");
const successEl = document.getElementById("contact-success");
const errorEl = document.getElementById("contact-error");
const submitBtn = document.getElementById("contact-submit");
const formWrap = form ? form.closest(".contact__form-wrap") : null;

if (form && successEl && errorEl && submitBtn) {
  const labelEl = submitBtn.querySelector(".contact__submit-label");
  const defaultLabel = labelEl?.textContent?.trim() || "Enviar mensaje";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const fields = [
    {
      input: form.querySelector("#contact-name"),
      err: form.querySelector("#contact-name-error"),
      validate: (v) =>
        v.trim().length >= 2 ? "" : "Escribe tu nombre completo (mínimo 2 caracteres).",
    },
    {
      input: form.querySelector("#contact-email"),
      err: form.querySelector("#contact-email-error"),
      validate: (v) => {
        const value = v.trim();
        if (!value) return "Necesitamos un email para responderte.";
        if (!emailRegex.test(value)) return "El formato del email no es válido.";
        return "";
      },
    },
    {
      input: form.querySelector("#contact-type"),
      err: form.querySelector("#contact-type-error"),
      validate: (v) => (v ? "" : "Selecciona el tipo de proyecto."),
    },
    {
      input: form.querySelector("#contact-message"),
      err: form.querySelector("#contact-message-error"),
      validate: (v) =>
        v.trim().length >= 10 ? "" : "Cuéntanos un poco más (mínimo 10 caracteres).",
    },
  ].filter((f) => f.input && f.err);

  function setFieldError(field, msg) {
    if (msg) {
      field.err.textContent = msg;
      field.err.classList.add("contact__error-msg--visible");
      field.input.setAttribute("aria-invalid", "true");
    } else {
      field.err.textContent = "";
      field.err.classList.remove("contact__error-msg--visible");
      field.input.setAttribute("aria-invalid", "false");
    }
  }

  function clearAllFieldErrors() {
    fields.forEach((f) => setFieldError(f, ""));
  }

  fields.forEach((f) => {
    f.input.addEventListener("blur", () => setFieldError(f, f.validate(f.input.value)));
    f.input.addEventListener("input", () => {
      if (f.input.getAttribute("aria-invalid") === "true") {
        setFieldError(f, f.validate(f.input.value));
      }
    });
    if (f.input.tagName === "SELECT") {
      f.input.addEventListener("change", () => setFieldError(f, f.validate(f.input.value)));
    }
  });

  let successTimer = null;
  let errorTimer = null;

  function showSuccess() {
    if (errorTimer) window.clearTimeout(errorTimer);
    errorEl.classList.remove("contact__error--visible");
    successEl.classList.add("contact__success--visible");
    if (formWrap) {
      formWrap.classList.add("is-success");
      window.setTimeout(() => formWrap.classList.remove("is-success"), 700);
    }
    if (successTimer) window.clearTimeout(successTimer);
    successTimer = window.setTimeout(() => {
      successEl.classList.remove("contact__success--visible");
    }, 4200);
  }

  function showError(msg) {
    if (successTimer) window.clearTimeout(successTimer);
    successEl.classList.remove("contact__success--visible");
    errorEl.textContent = msg || "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos segundos.";
    errorEl.classList.add("contact__error--visible");
    if (errorTimer) window.clearTimeout(errorTimer);
    errorTimer = window.setTimeout(() => {
      errorEl.classList.remove("contact__error--visible");
    }, 6000);
  }

  function setSubmitting(busy) {
    submitBtn.disabled = busy;
    submitBtn.setAttribute("aria-busy", busy ? "true" : "false");
    if (labelEl) labelEl.textContent = busy ? "Enviando..." : defaultLabel;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    let firstInvalid = null;
    fields.forEach((f) => {
      const msg = f.validate(f.input.value);
      setFieldError(f, msg);
      if (msg && !firstInvalid) firstInvalid = f.input;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const accessKeyInput = form.querySelector('input[name="access_key"]');
    const accessKey = accessKeyInput?.value?.trim() || "";
    if (!accessKey || accessKey === "YOUR_WEB3FORMS_KEY") {
      showError("Configura tu access_key de Web3Forms para activar el envío.");
      console.warn(
        "[contact-form] Falta el access_key real de Web3Forms. " +
          "Reemplaza YOUR_WEB3FORMS_KEY en index.html por la clave de https://web3forms.com."
      );
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData(form);
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        showSuccess();
        form.reset();
        clearAllFieldErrors();
      } else {
        showError(data.message || "No pudimos enviar tu mensaje. Inténtalo de nuevo.");
      }
    } catch (err) {
      showError("Hubo un problema con la conexión. Comprueba tu red e inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  });
}
