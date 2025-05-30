<template>
  <b-container
    v-if="authclient"
    class="pt-2 pb-3"
  >
    <c-content-header
      :title="title"
    >
      <b-button
        v-if="authClientID && canCreate"
        variant="primary"
        :to="{ name: 'system.authClient.new' }"
      >
        {{ $t('new') }}
      </b-button>

      <c-permissions-button
        v-if="authClientID && canGrant"
        :title="authclient.meta.name || authclient.handle || authClientID"
        :target="authclient.meta.name || authclient.handle || authClientID"
        :resource="`corteza::system:auth-client/${authClientID}`"
      >
        <font-awesome-icon :icon="['fas', 'lock']" />
        {{ $t('permissions') }}
      </c-permissions-button>
    </c-content-header>

    <c-authclient-editor-info
      :key="authClientID"
      :resource="authclient"
      :processing="info.processing"
      :success="info.success"
      :can-delete="authclient && authclient.authClientID && !authclient.isDefault && authclient.canDeleteAuthClient"
      :can-create="canCreate"
      @submit="onSubmit($event)"
      @delete="onDelete($event)"
      @undelete="onUndelete($event)"
    />
  </b-container>
</template>
<script>
import { isEqual } from 'lodash'
import editorHelpers from 'corteza-webapp-admin/src/mixins/editorHelpers'
import CAuthclientEditorInfo from 'corteza-webapp-admin/src/components/Authclient/CAuthclientEditorInfo'
import { system } from '@cortezaproject/corteza-js'
import { mapGetters } from 'vuex'

export default {
  components: {
    CAuthclientEditorInfo,
  },

  i18nOptions: {
    namespaces: 'system.authclients',
    keyPrefix: 'editor',
  },

  mixins: [
    editorHelpers,
  ],

  beforeRouteUpdate (to, from, next) {
    this.checkUnsavedChanges(next, to)
  },

  beforeRouteLeave (to, from, next) {
    this.checkUnsavedChanges(next, to)
  },

  props: {
    authClientID: {
      type: String,
      required: false,
      default: undefined,
    },
  },

  data () {
    return {
      authclient: undefined,
      initialAuthclientState: undefined,
      secret: '',

      info: {
        processing: false,
        success: false,
      },
    }
  },

  computed: {
    ...mapGetters({
      can: 'rbac/can',
    }),

    canCreate () {
      return this.can('system/', 'auth-client.create')
    },

    canGrant () {
      return this.can('system/', 'grant')
    },

    title () {
      return this.authClientID ? this.$t('title.edit') : this.$t('title.create')
    },
  },

  watch: {
    authClientID: {
      immediate: true,
      handler () {
        if (this.authClientID) {
          this.fetchAuthclient()
        } else {
          this.authclient = new system.AuthClient()
          this.initialAuthclientState = this.authclient.clone()
        }
      },
    },
  },

  methods: {
    fetchAuthclient () {
      this.incLoader()

      this.$SystemAPI.authClientRead({ clientID: this.authClientID })
        .then(ac => {
          this.authclient = new system.AuthClient(ac)
          this.initialAuthclientState = this.authclient.clone()
        })
        .catch(this.toastErrorHandler(this.$t('notification:authclient.fetch.error')))
        .finally(() => {
          this.decLoader()
        })
    },

    onSubmit (authclient) {
      this.info.processing = true

      if (this.authClientID) {
        // workaround in API client inconsistency:
        const clientID = this.authClientID

        this.$SystemAPI.authClientUpdate({ clientID, ...authclient })
          .then(ac => {
            this.authclient = new system.AuthClient(ac)
            this.initialAuthclientState = this.authclient.clone()

            this.animateSuccess('info')
            this.toastSuccess(this.$t('notification:authclient.update.success'))
          })
          .catch(this.toastErrorHandler(this.$t('notification:authclient.update.error')))
          .finally(() => {
            this.info.processing = false
          })
      } else {
        this.$SystemAPI.authClientCreate({ ...authclient })
          .then((ac) => {
            this.authclient = new system.AuthClient(ac)
            this.initialAuthclientState = this.authclient.clone()
            const { authClientID } = ac

            this.animateSuccess('info')
            this.toastSuccess(this.$t('notification:authclient.create.success'))

            this.$router.push({ name: 'system.authClient.edit', params: { authClientID } })
          })
          .catch(this.toastErrorHandler(this.$t('notification:authclient.create.error')))
          .finally(() => {
            this.info.processing = false
          })
      }
    },

    onDelete () {
      this.incLoader()
      const clientID = this.authClientID
      this.$SystemAPI.authClientDelete({ clientID })
        .then(() => {
          this.fetchAuthclient()

          this.authclient.deletedAt = new Date()

          this.toastSuccess(this.$t('notification:authclient.delete.success'))
          this.$router.push({ name: 'system.authClient' })
        })
        .catch(this.toastErrorHandler(this.$t('notification:authclient.authclient.error')))
        .finally(() => this.decLoader())
    },

    onUndelete () {
      this.incLoader()
      const clientID = this.authClientID
      this.$SystemAPI.authClientUndelete({ clientID })
        .then(() => {
          this.fetchAuthclient()

          this.toastSuccess(this.$t('notification:authclient.undelete.success'))
        })
        .catch(this.toastErrorHandler(this.$t('notification:authclient.authclient.error')))
        .finally(() => this.decLoader())
    },

    checkUnsavedChanges (next, to) {
      const isNewPage = this.$route.path.includes('/new') && to.name.includes('edit')
      const { deletedAt } = this.authclient || {}

      if (isNewPage || deletedAt) {
        next(true)
      } else if (!to.name.includes('edit')) {
        next(!isEqual(this.authclient, this.initialAuthclientState) ? window.confirm(this.$t('general:editor.unsavedChanges')) : true)
      }
    },
  },
}
</script>
