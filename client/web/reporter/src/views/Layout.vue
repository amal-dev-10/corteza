<template>
  <div class="d-flex flex-column w-100 vh-100 overflow-hidden">
    <header>
      <c-topbar
        :sidebar-pinned="pinned"
        :settings="$Settings.get('ui.topbar', {})"
        :labels="{
          appMenu: $t('navigation:appMenu'),
          helpForum: $t('navigation:help.forum'),
          helpDocumentation: $t('navigation:help.documentation'),
          helpFeedback: $t('navigation:help.feedback'),
          helpVersion: $t('navigation:help.version'),
          userSettingsLoggedInAs: $t('navigation:userSettings.loggedInAs', { user }),
          userSettingsProfile: $t('navigation:userSettings.profile'),
          userSettingsChangePassword: $t('navigation:userSettings.changePassword'),
          userSettingsLogout: $t('navigation:userSettings.logout'),
          lightTheme: $t('general:themes.labels.light'),
          darkTheme: $t('general:themes.labels.dark'),
        }"
      >
        <template #title>
          <portal-target
            name="topbar-title"
          />
        </template>

        <template #tools>
          <portal-target
            name="topbar-tools"
            class="gap-1"
          />
        </template>
      </c-topbar>
    </header>

    <aside>
      <c-sidebar
        :expanded.sync="expanded"
        :pinned.sync="pinned"
        :icon="icon"
        :logo="logo"
        :disabled-routes="disabledRoutes"
        expand-on-click
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
    </aside>

    <main class="d-inline-flex h-100 overflow-auto">
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

      <div
        class="d-flex flex-column w-100 pb-safari"
      >
        <router-view
          class="flex-grow-1 overflow-auto"
        />

        <portal-target
          name="report-toolbar"
        />
      </div>
    </main>
    <!-- <c-prompts /> -->
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
    <report-sidebar />

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
import { components } from '@cortezaproject/corteza-vue'
import ReportSidebar from 'corteza-webapp-reporter/src/components/ReportSidebar'
const { CPermissionsModal, CTopbar, CSidebar, CExtendSession } = components

export default {
  components: {
    CPermissionsModal,
    CTopbar,
    CSidebar,
    ReportSidebar,
    CExtendSession,
  },

  data () {
    return {
      expanded: undefined,
      pinned: undefined,
      disabledRoutes: [
        'report.list',
        'report.create',
        'report.edit',
      ],
    }
  },

  computed: {
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
          favicon.href = icon
        }
      },
    },
  },

  created () {
    this.$root.$on('alert', this.displayToast)
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
