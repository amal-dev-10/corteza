<template>
  <b-container
    fluid="xl"
    class="pt-2 pb-3"
  >
    <c-content-header
      :title="$t('title')"
    />
    <b-card
      body-class="p-0"
      header-class="border-bottom"
      footer-class="border-top d-flex flex-wrap flex-fill-child gap-1"
      class="shadow-sm"
    >
      <div class="align-items-center gap-1 p-3">
        <b-button
          variant="primary"
          size="lg"
          @click="openEditor()"
        >
          {{ $t('code-snippets.add') }}
        </b-button>
      </div>

      <b-table
        :items="codeSnippets"
        :fields="codeSnippetsFields"
        head-variant="light"
        show-empty
        hover
        sort
        sticky-header
        tbody-tr-class="pointer"
        class="mb-0"
        style="min-height: 5rem; max-height: 82vh;"
        @row-clicked="(event, index) => openEditor(index)"
      >
        <template #empty>
          <p
            data-test-id="no-matches"
            class="text-center text-dark"
            style="margin-top: 1vh;"
          >
            {{ $t('code-snippets.empty') }}
          </p>
        </template>

        <template #cell(enabled)="{ value }">
          <font-awesome-icon
            :icon="value ? ['fas', 'check'] : ['fas', 'times']"
            :class="value ? 'text-primary' : 'text-extra-light'"
          />
        </template>

        <template #cell(actions)="{ index }">
          <b-button
            variant="link"
            @click="openEditor(index)"
          >
            <font-awesome-icon
              :icon="['fas', 'wrench']"
            />
          </b-button>

          <c-input-confirm
            :disabled="codeSnippet.processing"
            @confirmed="deleteCodeSnippet(index)"
          />
        </template>
      </b-table>

      <b-modal
        id="modal-codeSnippet"
        v-model="modal.open"
        :title="modal.title"
        scrollable
        size="lg"
        title-class="text-capitalize"
        @ok="saveSettings()"
      >
        <b-checkbox
          v-model="modal.data.enabled"
          class="mb-3"
        >
          {{ $t('code-snippets.enabled') }}
        </b-checkbox>

        <b-form-group
          :label="$t('code-snippets.form.name.label')"
          label-class="text-primary"
        >
          <b-input-group>
            <b-form-input
              v-model="modal.data.name"
              required
            />
          </b-input-group>
        </b-form-group>

        <div>
          <div class="mb-2">
            <h5>
              {{ $t('code-snippets.add') }}
            </h5>
            <span class="text-muted">
              {{ $t('code-snippets.form.value.description') }}
            </span>
          </div>

          <c-ace-editor
            v-model="modal.data.script"
            lang="javascript"
            height="500px"
            font-size="14px"
            show-line-numbers
            :border="false"
            :show-popout="false"
          />
        </div>

        <template #modal-footer="{ ok, cancel }">
          <c-input-confirm
            v-if="modal.index >= 0"
            :text="$t('general:label.delete')"
            size="md"
            variant="danger"
            @confirmed="deleteCodeSnippet(modal.index)"
          />

          <b-button
            variant="light"
            class="ml-auto"
            @click="cancel()"
          >
            {{ $t('general:label.cancel') }}
          </b-button>

          <b-button
            :disabled="saveDisabled"
            variant="primary"
            @click="ok()"
          >
            {{ $t('general:label.saveAndClose') }}
          </b-button>
        </template>
      </b-modal>
    </b-card>
  </b-container>
</template>

<script>
import editorHelpers from 'corteza-webapp-admin/src/mixins/editorHelpers'
import { components } from '@cortezaproject/corteza-vue'
import { mapGetters } from 'vuex'
const { CAceEditor } = components

export default {
  name: 'CSystemCodeSnippetEditor',

  i18nOptions: {
    namespaces: 'system.code-snippets',
    keyPrefix: 'editor',
  },

  components: {
    CAceEditor,
  },

  mixins: [
    editorHelpers,
  ],

  data () {
    return {
      codeSnippets: [],
      modal: {
        open: false,
        index: null,
        title: null,
        data: {},
      },

      codeSnippet: {
        processing: false,
        success: false,
      },
    }
  },

  computed: {
    ...mapGetters({
      canManage: 'rbac/can',
    }),

    codeSnippetsFields () {
      return [
        { key: 'name', label: this.$t('code-snippets.table-headers.name') },
        { key: 'enabled', label: this.$t('code-snippets.table-headers.enabled'), thClass: 'text-center', tdClass: 'text-center' },
        { key: 'script', label: this.$t('code-snippets.table-headers.script'), tdClass: 'text-break', thStyle: 'min-width: 25rem;' },
        { key: 'actions', label: '', thStyle: { 'min-width': '7rem' }, tdClass: 'text-right' },
      ]
    },

    saveDisabled () {
      return !this.modal.data.name || !this.modal.data.script
    },
  },

  created () {
    this.fetchSettings()
  },

  methods: {
    openEditor (index) {
      const item = index >= 0
        ? this.codeSnippets[index]
        : {
            name: '',
            script: '<' + 'script> ' + '</' + 'script>',
            enabled: true,
          }

      this.modal.index = index
      this.modal.title = item.name || this.$t('code-snippets.add')
      this.modal.data = { ...item }
      this.modal.open = true
    },

    fetchSettings () {
      this.incLoader()
      this.$Settings.fetch()

      return this.$SystemAPI.settingsList({ prefix: 'code-snippets' })
        .then(settings => {
          if (settings && settings[0]) {
            this.codeSnippets = settings[0].value
          } else {
            this.codeSnippets = []
          }
        })
        .catch(this.toastErrorHandler(this.$t('notification:settings.code-snippet.fetch.error')))
        .finally(() => {
          this.decLoader()
        })
    },

    settingsUpdate (action) {
      this.codeSnippet.processing = true

      this.$SystemAPI.settingsUpdate({ values: [{ name: 'code-snippets', value: this.codeSnippets }] })
        .then(() => {
          this.$Settings.fetch()
          this.animateSuccess('codeSnippet')
          if (action === 'delete') {
            this.toastSuccess(this.$t('notification:settings.code-snippet.delete.success'))
          } else {
            this.toastSuccess(this.$t('notification:settings.code-snippet.update.success'))
          }
        })
        .catch(this.toastErrorHandler(this.$t('notification:settings.code-snippet.update.error')))
        .finally(() => {
          this.codeSnippet.processing = false
        })
    },

    saveSettings () {
      if (this.modal.index >= 0) {
        this.codeSnippets.splice(this.modal.index, 1, this.modal.data)
      } else {
        this.codeSnippets.push(this.modal.data)
      }

      this.settingsUpdate('update')
    },

    deleteCodeSnippet (i) {
      this.codeSnippets.splice(i, 1)
      this.settingsUpdate('delete')
      this.$bvModal.hide('modal-codeSnippet')
    },
  },
}

</script>
