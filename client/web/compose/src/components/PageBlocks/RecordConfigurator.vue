<template>
  <b-tab
    :title="$t('record.label')"
    no-body
  >
    <div class="px-3 pt-3">
      <h5 class="mb-3">
        {{ $t('recordList.record.generalLabel') }}
      </h5>

      <b-row>
        <b-col cols="12">
          <b-form-group
            :label="$t('general.module')"
            label-class="text-primary"
          >
            <b-form-input
              v-if="module"
              v-model="module.name"
              type="text"
              readonly
            />
          </b-form-group>
        </b-col>

        <b-col
          cols="12"
          lg="6"
        >
          <b-form-group
            :label="$t('record.inlineEdit.enabled')"
            label-class="text-primary"
          >
            <c-input-checkbox
              v-model="inlineRecordEditEnabled"
              switch
              :labels="checkboxLabel"
            />
          </b-form-group>
        </b-col>

        <b-col
          cols="12"
          lg="6"
        >
          <b-form-group
            :label="$t('record.inlineEdit.allowAddField')"
            label-class="text-primary"
          >
            <c-input-checkbox
              v-model="options.inlineRecordEditAllowAddField"
              switch
              :labels="checkboxLabel"
            />
          </b-form-group>
        </b-col>

        <b-col
          cols="12"
          lg="6"
        >
          <b-form-group
            :label="$t('record.horizontalFormLayout')"
            label-class="text-primary"
          >
            <c-input-checkbox
              v-model="options.horizontalFieldLayoutEnabled"
              switch
              :disabled="options.recordFieldLayoutOption === 'noWrap'"
              :labels="checkboxLabel"
            />
          </b-form-group>
        </b-col>

        <b-col
          cols="12"
          lg="6"
        >
          <b-form-group
            :label="$t('record.fieldsLayoutMode.label')"
            label-class="text-primary"
          >
            <c-input-select
              v-model="options.recordFieldLayoutOption"
              :options="recordFieldLayoutOptions"
              :reduce="option => option.value"
              :get-option-key="option => option.label"
              @input="handleRecordFieldLayout"
            />
          </b-form-group>
        </b-col>

        <b-col
          cols="12"
          lg="6"
        >
          <b-form-group
            :label="$t('record.referenceRecordField')"
            :description="$t('record.referenceRecordFieldDescription')"
            label-class="text-primary"
          >
            <c-input-select
              v-model="options.referenceField"
              :options="recordSelectorFields"
              :get-option-label="getFieldLabel"
              :get-option-key="getOptionKey"
              :placeholder="$t('record.referenceRecordFieldPlaceholder')"
              :reduce="getOptionKey"
              @input="updateReferenceModule($event, [])"
            />
          </b-form-group>
        </b-col>
      </b-row>
    </div>

    <hr v-if="module">

    <div
      v-if="module"
      class="px-3"
    >
      <h5 class="mb-3">
        {{ $t('module:general.fields') }}
      </h5>

      <b-row>
        <b-col cols="12">
          <field-picker
            :module="fieldModule"
            :fields.sync="options.fields"
            style="height: 52vh;"
          />
        </b-col>
      </b-row>

      <b-row
        v-if="isRecordFieldUsedConfigured"
        class="mt-3"
      >
        <b-col
          cols="12"
          lg="6"
        >
          <b-form-group
            :label="$t('record.recordSelectorDisplayOptions')"
            label-class="text-primary"
          >
            <b-form-select
              v-model="options.recordSelectorDisplayOption"
              :options="recordDisplayOptions"
            />
          </b-form-group>
        </b-col>

        <b-col
          cols="12"
          lg="6"
        >
          <b-form-group
            :label="$t('record.recordSelectorCanAddRecord')"
            label-class="text-primary"
          >
            <c-input-checkbox
              v-model="options.recordSelectorShowAddRecordButton"
              switch
              :labels="checkboxLabel"
            />
          </b-form-group>
        </b-col>

        <b-col
          cols="12"
          lg="6"
        >
          <b-form-group
            :label="$t('record.recordSelectorAddRecordDisplayOption')"
            label-class="text-primary"
          >
            <b-form-select
              v-model="options.recordSelectorAddRecordDisplayOption"
              :options="recordDisplayOptions"
              :disabled="!options.recordSelectorShowAddRecordButton"
            />
          </b-form-group>
        </b-col>
      </b-row>
    </div>

    <hr>

    <div class="px-3">
      <h5 class="d-flex align-items-center justify-content-between mb-2">
        {{ $t('record.fieldConditions.label') }}

        <c-hint
          :tooltip="$t('record.fieldConditions.tooltip.performance')"
          icon-class="text-warning"
        />

        <b-button
          variant="link"
          :href="visibilityDocumentationURL"
          target="_blank"
          class="p-0 ml-auto"
        >
          {{ $t('record.fieldConditions.help') }}
        </b-button>
      </h5>

      <i18next
        path="general.visibility.condition.description.record-page"
        tag="small"
        class="text-muted"
      >
        <code>record.values.fieldName</code>
        <code>user.(userID/email...)</code>
        <code>user.userID == record.values.createdBy</code>
        <code>record.values.fieldName == "value"</code>
        <code>record.values.ownedBy == user.userID</code>
      </i18next>

      <c-form-table-wrapper
        :labels="{
          addButton: $t('general:label.add')
        }"
        :disable-add-button="addRuleDisabled"
        class="my-3"
        @add-item="addRule"
      >
        <b-table-simple
          v-if="block.options.fieldConditions.length > 0"
          borderless
          small
          responsive
        >
          <b-thead>
            <b-tr>
              <b-th
                class="text-primary"
              >
                {{ $t('record.fieldConditions.field') }}
              </b-th>
              <b-th
                class="text-primary"
              >
                {{ $t('record.fieldConditions.condition') }}
              </b-th>
              <b-th />
            </b-tr>
          </b-thead>
          <b-tbody>
            <b-tr
              v-for="(condition, i) in block.options.fieldConditions"
              :key="i"
            >
              <b-td
                class="align-middle"
                style="width: 33%; min-width: 250px;"
              >
                <c-input-select
                  v-model="condition.field"
                  :options="block.options.fields"
                  :placeholder="$t('record.fieldConditions.selectPlaceholder')"
                  :selectable="option => isSelectable(option)"
                  :get-option-label="getOptionLabel"
                  :get-option-key="getOptionKey"
                  :reduce="option => option.isSystem ? option.name : option.fieldID"
                />
              </b-td>
              <b-td
                class="align-middle"
                style="min-width: 300px;"
              >
                <b-input-group>
                  <b-input-group-prepend>
                    <b-button variant="extra-light">
                      ƒ
                    </b-button>
                  </b-input-group-prepend>
                  <c-input-expression
                    v-model="condition.condition"
                    auto-complete
                    :placeholder="$t('record.fieldConditions.placeholder')"
                    :suggestion-params="visibilityAutoCompleteParams"
                    height="2.375rem"
                    class="flex-grow-1"
                  />
                </b-input-group>
              </b-td>
              <b-td
                class="text-right align-middle"
                style="width: 100px;"
              >
                <c-input-confirm
                  show-icon
                  @confirmed="deleteRule(i)"
                />
              </b-td>
            </b-tr>
          </b-tbody>
        </b-table-simple>
      </c-form-table-wrapper>
    </div>
  </b-tab>
</template>
<script>
import base from './base'
import FieldPicker from 'corteza-webapp-compose/src/components/Common/FieldPicker'
import { mapActions } from 'vuex'
import { NoID, compose } from '@cortezaproject/corteza-js'
import autocomplete from 'corteza-webapp-compose/src/mixins/autocomplete.js'
import { components } from '@cortezaproject/corteza-vue'

const { CInputExpression } = components

export default {
  i18nOptions: {
    namespaces: 'block',
  },

  name: 'Record',

  components: {
    FieldPicker,
    CInputExpression,
  },

  extends: base,

  mixins: [autocomplete],

  data () {
    return {
      referenceModule: undefined,
      checkboxLabel: {
        on: this.$t('general:label.yes'),
        off: this.$t('general:label.no'),
      },
    }
  },

  computed: {
    visibilityDocumentationURL () {
      // eslint-disable-next-line no-undef
      const [year, month] = VERSION.split('.')
      return `https://docs.cortezaproject.org/corteza-docs/${year}.${month}/integrator-guide/compose-configuration/page-layouts.html#visibility-condition`
    },

    addRuleDisabled () {
      return this.block.options.fields.filter(f => !f.isRequired).length === this.block.options.fieldConditions.length
    },

    recordDisplayOptions () {
      return [
        { value: 'sameTab', text: this.$t('record.openInSameTab') },
        { value: 'newTab', text: this.$t('record.openInNewTab') },
        { value: 'modal', text: this.$t('record.openInModal') },
      ]
    },

    recordFieldLayoutOptions () {
      return [
        { value: 'default', label: this.$t('record.fieldsLayoutMode.default') },
        { value: 'noWrap', label: this.$t('record.fieldsLayoutMode.noWrap') },
        { value: 'wrap', label: this.$t('record.fieldsLayoutMode.wrap') },
      ]
    },

    recordSelectorFields () {
      return this.module.fields.filter(f => f.kind === 'Record' && !f.isMulti)
    },

    fieldModule () {
      return (this.options.referenceField && this.referenceModule) ? this.referenceModule : this.module
    },

    inlineRecordEditEnabled: {
      get () {
        return !!this.options.inlineRecordEditEnabled
      },
      set (v) {
        this.options.inlineRecordEditEnabled = v
      },
    },

    isRecordFieldUsedConfigured () {
      if (this.options.fields.length === 0) {
        return this.module.fields.some(f => f.kind === 'Record')
      } else {
        return this.options.fields.some(f => f.kind === 'Record')
      }
    },
  },

  created () {
    if (this.options.referenceField) {
      this.updateReferenceModule(this.options.referenceField, this.options.fields)
    }
  },

  methods: {
    ...mapActions({
      findModuleByID: 'module/findByID',
    }),

    addRule () {
      this.options.fieldConditions.push({
        field: undefined,
        condition: '',
      })
    },

    deleteRule (i) {
      this.options.fieldConditions.splice(i, 1)
    },

    isSelectable (option) {
      return !this.block.options.fieldConditions.find(({ field }) => field === option.fieldID || field === option.name) && !option.isRequired
    },

    getOptionLabel (option) {
      return option.label || option.name
    },

    getFieldLabel ({ name, label }) {
      return label || name
    },

    getOptionKey ({ fieldID, name }) {
      return fieldID !== NoID ? fieldID : name
    },

    updateReferenceModule (fieldID, fields) {
      if (!fieldID) {
        this.block.options.fields = []
        this.block.options.referenceModuleID = undefined
        return
      }

      const field = this.recordSelectorFields.find(f => f.fieldID === fieldID)
      const moduleID = field && field.options && field.options.moduleID

      if (moduleID) {
        this.findModuleByID({ namespace: this.namespace.namespaceID, moduleID })
          .then(module => {
            this.block.options.fields = fields
            this.block.options.referenceModuleID = module.moduleID
            this.referenceModule = new compose.Module({ ...module })
          })
      }
    },

    handleRecordFieldLayout (v) {
      if (v !== 'noWrap') return

      this.block.options.horizontalFieldLayoutEnabled = false
    },
  },
}
</script>
