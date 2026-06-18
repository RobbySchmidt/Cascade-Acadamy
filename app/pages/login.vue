<script setup lang="ts">
import { Check } from 'lucide-vue-next'

definePageMeta({ layout: 'blank' })

const { login, loginAsGuest } = useAuth()

const identifier = ref('')
const password = ref('')
const error = ref('')
const pending = ref(false)

const features = [
  'CSS schreiben mit Live-Vorschau',
  'Automatische Prüfung jeder Aufgabe',
  'Streak, Abzeichen & Live-Chat',
]

async function onSubmit() {
  if (pending.value) return
  error.value = ''
  pending.value = true
  try {
    await login(identifier.value, password.value)
    await navigateTo('/kurse')
  } catch {
    error.value = 'E-Mail oder Passwort ist falsch.'
  } finally {
    pending.value = false
  }
}

async function onGuest() {
  loginAsGuest()
  await navigateTo('/kurse')
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- LEFT brand panel -->
    <div
      class="relative flex flex-1 flex-col justify-between overflow-hidden"
      style="background: linear-gradient(150deg,#0E7A70,#12B5A5); padding: 48px"
    >
      <LightCircles
        :circles="[
          { size: 320, top: '-120px', right: '-80px', opacity: 0.10 },
          { size: 240, bottom: '-90px', left: '-70px', opacity: 0.08 },
        ]"
      />

      <!-- top: logo -->
      <div class="relative z-10">
        <BrandLogo white />
      </div>

      <!-- middle: title + features -->
      <div class="relative z-10 flex flex-col" style="gap: 18px">
        <h1
          class="font-display font-extrabold text-white"
          style="font-size: 32px; line-height: 1.15; letter-spacing: -0.5px"
        >Schön, dass du wieder da bist.</h1>
        <p class="text-white/80" style="font-size: 16px; line-height: 1.5; max-width: 380px">
          Mach da weiter, wo du aufgehört hast — dein Fortschritt wartet.
        </p>

        <div class="flex flex-col" style="gap: 14px; margin-top: 8px">
          <div v-for="f in features" :key="f" class="flex items-center" style="gap: 12px">
            <span
              class="flex flex-shrink-0 items-center justify-center text-white"
              style="width: 24px; height: 24px; border-radius: 7px; background: rgba(255,255,255,0.2)"
            ><Check :size="14" :stroke-width="3" /></span>
            <span class="font-medium text-white" style="font-size: 15px">{{ f }}</span>
          </div>
        </div>
      </div>

      <!-- bottom: testimonial -->
      <p class="relative z-10" style="color: rgba(255,255,255,0.75); font-size: 14px; line-height: 1.5; max-width: 340px">
        „Endlich verstehe ich das Box-Modell.“ — Lena, Anfängerin
      </p>
    </div>

    <!-- RIGHT form panel -->
    <div class="flex items-center justify-center bg-surface" style="width: 480px; flex-shrink: 0; padding: 40px">
      <div class="w-full" style="max-width: 340px">
        <h2
          class="font-display font-bold text-text"
          style="font-size: 27px; letter-spacing: -0.3px"
        >Willkommen zurück</h2>
        <p class="text-text-muted" style="font-size: 15px; margin-top: 6px">
          Melde dich an, um deinen Fortschritt zu sichern.
        </p>

        <form class="flex flex-col" style="gap: 16px; margin-top: 28px" @submit.prevent="onSubmit">
          <!-- E-Mail -->
          <div class="flex flex-col" style="gap: 7px">
            <label for="login-identifier" class="font-semibold text-text" style="font-size: 13px">E-Mail</label>
            <input
              id="login-identifier"
              v-model="identifier"
              type="text"
              placeholder="du@beispiel.de"
              autocomplete="username"
              class="w-full text-text placeholder:text-text-faint focus:outline-none focus:ring-[3px] focus:ring-[rgba(18,181,165,0.18)] focus:border-teal-600"
              style="border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); border-radius: 11px; padding: 12px 14px; font-size: 15px"
            >
          </div>

          <!-- Passwort -->
          <div class="flex flex-col" style="gap: 7px">
            <div class="flex items-center justify-between">
              <label for="login-password" class="font-semibold text-text" style="font-size: 13px">Passwort</label>
              <a href="#" class="font-semibold text-teal-600" style="font-size: 13px" @click.prevent>vergessen?</a>
            </div>
            <input
              id="login-password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              class="w-full text-text placeholder:text-text-faint focus:outline-none focus:ring-[3px] focus:ring-[rgba(18,181,165,0.18)] focus:border-teal-600"
              style="border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); border-radius: 11px; padding: 12px 14px; font-size: 15px"
            >
          </div>

          <p v-if="error" class="text-red-600" style="font-size: 13px; margin-top: -4px">{{ error }}</p>

          <!-- Anmelden -->
          <button
            type="submit"
            :disabled="pending"
            class="w-full bg-teal-600 font-semibold text-on-teal shadow-btn transition-colors hover:bg-teal-700 disabled:opacity-70"
            style="border-radius: 11px; padding: 12px; font-size: 15px"
          >{{ pending ? 'Wird angemeldet…' : 'Anmelden' }}</button>
        </form>

        <!-- oder divider -->
        <div class="flex items-center" style="gap: 12px; margin: 20px 0">
          <span class="flex-1" style="height: 1px; background: rgba(255,255,255,0.08)" />
          <span class="text-text-faint" style="font-size: 13px">oder</span>
          <span class="flex-1" style="height: 1px; background: rgba(255,255,255,0.08)" />
        </div>

        <!-- Ohne Konto loslernen -->
        <button
          type="button"
          class="w-full bg-teal-soft font-semibold text-teal-700 transition-colors hover:bg-[rgba(18,181,165,0.2)]"
          style="border-radius: 11px; padding: 12px; font-size: 15px; border: 1px solid rgba(18,181,165,0.25)"
          @click="onGuest"
        >Ohne Konto loslernen</button>
        <p class="text-center text-text-faint" style="font-size: 12.5px; margin-top: 8px">
          Dein Fortschritt wird lokal im Browser gespeichert.
        </p>

        <!-- footer -->
        <p class="text-center text-text-muted" style="font-size: 14px; margin-top: 24px">
          Neu hier? <NuxtLink to="/kurse" class="font-semibold text-teal-700 no-underline">Konto erstellen</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
