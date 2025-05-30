<template>
  <div class="d-flex flex-column w-100 vh-100 overflow-hidden">
    <header>
      <c-topbar
        :sidebar-pinned="pinned"
        :settings="$Settings.get('ui.topbar', {})"
        :labels="{
          appMenu: $t('navigation.appMenu'),
          helpForum: $t('navigation.help.forum'),
          helpDocumentation: $t('navigation.help.documentation'),
          helpFeedback: $t('navigation.help.feedback'),
          helpVersion: $t('navigation.help.version'),
          userSettingsLoggedInAs: $t('navigation.userSettings.loggedInAs', { user }),
          userSettingsProfile: $t('navigation.userSettings.profile'),
          userSettingsChangePassword: $t('navigation.userSettings.changePassword'),
          userSettingsLogout: $t('navigation.userSettings.logout'),
          lightTheme: $t('general:themes.labels.light'),
          darkTheme: $t('general:themes.labels.dark'),
        }"
      >
        <template #title>
          <portal-target name="topbar-title" />
        </template>

        <template #tools>
          <portal-target name="topbar-tools" />
        </template>
      </c-topbar>
    </header>

    <aside
      v-if="allowed"
    >
      <c-sidebar
        :expanded.sync="expanded"
        :pinned.sync="pinned"
        :icon="icon"
        :logo="logo"
        expand-on-click
        :right="textDirectionality() === 'rtl'"
      >
        <template #header-expanded>
          <portal-target name="sidebar-header-expanded" />
        </template>

        <template #body-expanded>
          <portal-target name="sidebar-body-expanded" />
        </template>

        <template #footer-expanded>
          <portal-target name="sidebar-footer-expanded" />
        </template>
      </c-sidebar>

      <portal to="sidebar-body-expanded">
        <c-the-main-nav />
      </portal>
    </aside>

    <main
      v-if="allowed"
      class="d-inline-flex h-100 overflow-auto"
    >
      <!--
        Content spacer
        Large and xl screens should push in content when the nav is expanded
      -->
      <template>
        <div
          class="sidebar-spacer d-print-none"
          :class="{
            'expanded': expanded && pinned,
          }"
        />
      </template>
      <div class="d-flex flex-column w-100 flex-fill pb-safari">
        <router-view />
      </div>
    </main>

    <c-prompts />

    <c-permissions-modal
      :labels="{
        save: $t('permissions:ui.save'),
        cancel: $t('permissions:ui.cancel'),
        loading: $t('permissions:ui.loading'),
        edit: {
          label: $t('permissions:ui.edit.label'),
          description: $t('permissions:ui.edit.description'),
        },
        evaluate: {
          label: $t('permissions:ui.evaluate.label'),
          description: $t('permissions:ui.evaluate.description'),
        },
        add: {
          label: $t('permissions:ui.add.label'),
          title: $t('permissions:ui.add.title'),
          save: $t('permissions:ui.add.save'),
          role: {
            label: $t('permissions:ui.add.role.label'),
            placeholder: $t('permissions:ui.add.role.placeholder'),
          },
          user: {
            label: $t('permissions:ui.add.user.label'),
            placeholder: $t('permissions:ui.add.user.placeholder'),
          },
        },
      }"
    />

    <c-extend-session
      v-if="isAutoLogoutEnabled"
      :timeout="$Settings.get('auth.autoLogout.timeout')"
      :labels="{
        extend: $t('general:extendSession.labels.extend'),
        warning: (countdownTime) => $t('general:extendSession.labels.warning', { countdownTime }),
      }"
    />
  </div>
</template>

<script>
import CTheMainNav from 'corteza-webapp-admin/src/components/CTheMainNav'
import { components, mixins } from '@cortezaproject/corteza-vue'
import { mapGetters } from 'vuex'

const { CExtendSession, CPermissionsModal, CPrompts, CTopbar, CSidebar } = components

export default {
  i18nOptions: {
    namespaces: 'admin',
  },

  components: {
    CPermissionsModal,
    CPrompts,
    CTopbar,
    CSidebar,
    CTheMainNav,
    CExtendSession,
  },

  mixins: [
    mixins.corredor,
  ],

  data () {
    return {
      allowed: false,
      error: null,
      expanded: window.innerWidth > 576,
      pinned: window.innerWidth > 576,
    }
  },

  computed: {
    ...mapGetters({
      can: 'rbac/can',
    }),

    user () {
      const { user } = this.$auth
      return user.name || user.handle || user.email || ''
    },

    icon () {
      return this.$Settings.attachment('ui.iconLogo')
    },

    logo () {
      return this.$Settings.attachment('ui.mainLogo')
    },

    isAutoLogoutEnabled () {
      return this.$Settings.get('auth.autoLogout.enabled')
    },
  },

  watch: {
    icon: {
      immediate: true,
      handler (icon) {
        if (icon) {
          const favicon = document.getElementById('favicon')
          if (favicon) {
            favicon.href = icon
          }
        }
      },
    },
  },

  created () {
    this.$root.$on('alert', this.displayToast)

    const rulesToCheck = [
      // Grant
      { resource: 'system/', operation: 'grant' },
      { resource: 'compose/', operation: 'grant' },
      { resource: 'federation/', operation: 'grant' },
      { resource: 'automation/', operation: 'grant' },
      // Create
      { resource: 'system/', operation: 'auth-client.create' },
      { resource: 'system/', operation: 'role.create' },
      { resource: 'system/', operation: 'user.create' },
      { resource: 'system/', operation: 'application.create' },
      { resource: 'system/', operation: 'template.create' },
      { resource: 'system/', operation: 'report.create' },
      { resource: 'system/', operation: 'queue.create' },
      { resource: 'system/', operation: 'apigw-route.create' },
      // Manage
      { resource: 'system/', operation: 'settings.read' },
      { resource: 'system/', operation: 'system.manage' },
      { resource: 'system/', operation: 'action-log.read' },
    ]

    this.allowed = rulesToCheck.some(({ resource, operation }) => this.can(resource, operation))

    // If not allowed to access, show error prompt and redirect after a delay
    if (!this.allowed) {
      this.toastDanger(this.$t('notification:notAllowed'))

      setTimeout(() => {
        window.location = '/..'
      }, 5000)
    }
  },

  methods: {
    displayToast ({ title, message, variant, countdown }) {
      this.$bvToast.toast(message, {
        title,
        variant,
        solid: true,
        autoHideDelay: countdown,
        toaster: 'b-toaster-bottom-right',
      })
    },
  },
}
</script>

<style scoped>
/* fixes bottom part of page being cut off */
/* CSS specific to iOS devices */
@supports (-webkit-touch-callout: none) {
  .pb-safari {
    padding-bottom: 5.5em;
  }
}
</style>
