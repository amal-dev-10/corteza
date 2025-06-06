<template>
  <div>
    <b-tab :title="$t('navigation.label')">
      <div class="mb-3">
        <h5>
          {{ $t("navigation.displayOptions") }}
        </h5>

        <b-row
          class="justify-content-between text-primary"
        >
          <b-col
            cols="12"
            lg="4"
          >
            <b-form-group
              :label="$t('navigation.appearance')"
              horizontal
              variant="primary"
              label-class="text-primary"
            >
              <b-form-radio-group
                v-model="options.display.appearance"
                :options="appearanceOptions"
                buttons
                button-variant="outline-secondary"
                size="sm"
              />
            </b-form-group>
          </b-col>

          <b-col
            cols="12"
            lg="4"
          >
            <b-form-group
              :label="$t('navigation.justify')"
              horizontal
              label-class="text-primary"
            >
              <b-form-radio-group
                v-model="options.display.justify"
                :options="justifyOptions"
                buttons
                button-variant="outline-secondary"
                size="sm"
              />
            </b-form-group>
          </b-col>

          <b-col
            cols="12"
            lg="4"
          >
            <b-form-group
              :label="$t('navigation.alignment')"
              horizontal
              label-class="text-primary"
            >
              <b-form-radio-group
                v-model="options.display.alignment"
                :options="alignmentOptions"
                buttons
                button-variant="outline-secondary"
                size="sm"
              />
            </b-form-group>
          </b-col>
        </b-row>
      </div>

      <hr class="my-2">

      <div class="mb-3 mt-2">
        <div class="d-flex align-items-center mb-4">
          <h5 class="mb-0">
            {{ $t("navigation.navigationItems") }}
          </h5>
        </div>

        <div class="mt-3">
          <c-form-table-wrapper
            :labels="{ addButton: $t('general:label.add') }"
            @add-item="addNavigationItem"
          >
            <draggable
              v-model="block.options.navigationItems"
              group="sort"
              handle=".grab"
            >
              <div
                v-for="(item, index) in block.options.navigationItems"
                :key="index"
              >
                <hr v-if="index">

                <b-table-simple
                  borderless
                  responsive="lg"
                  small
                >
                  <thead class="text-primary">
                    <tr>
                      <th
                        scope="col"
                        style="width: auto;"
                      />

                      <th
                        scope="col"
                        style="min-width: 200px;"
                      >
                        {{ $t("navigation.type") }}
                      </th>

                      <th
                        scope="col"
                        style="min-width: 200px;"
                      >
                        {{ $t("navigation.color") }}
                      </th>

                      <th
                        scope="col"
                        style="min-width: 200px;"
                      >
                        {{ $t("navigation.background") }}
                      </th>

                      <th
                        class="text-center"
                        scope="col"
                        style="width: 50px; min-width: 50px;"
                      >
                        {{ $t("navigation.enabled") }}
                      </th>

                      <th
                        scope="col"
                        style="width: auto; min-width: 100px;"
                      />
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td class="grab align-middle text-center">
                        <font-awesome-icon
                          :icon="['fas', 'bars']"
                          class="text-secondary"
                        />
                      </td>

                      <td class="align-middle">
                        <b-form-select
                          v-model="item.type"
                          :options="navigationItemTypes"
                        />
                      </td>

                      <td class="align-middle">
                        <c-input-color-picker
                          v-model="item.options.textColor"
                          :translations="{
                            modalTitle: $t('navigation.colorPicker'),
                            light: $t('general:themes.labels.light'),
                            dark: $t('general:themes.labels.dark'),
                            cancelBtnLabel: $t('general:label.cancel'),
                            saveBtnLabel: $t('general:label.saveAndClose')
                          }"
                          :theme-settings="themeSettings"
                          class="w-100"
                        />
                      </td>

                      <td class="align-middle">
                        <c-input-color-picker
                          v-model="item.options.backgroundColor"
                          :translations="{
                            modalTitle: $t('navigation.colorPicker'),
                            light: $t('general:themes.labels.light'),
                            dark: $t('general:themes.labels.dark'),
                            cancelBtnLabel: $t('general:label.cancel'),
                            saveBtnLabel: $t('general:label.saveAndClose')
                          }"
                          :theme-settings="themeSettings"
                          class="w-100"
                        />
                      </td>
                      <td class="d-flex align-items-center justify-content-center">
                        <c-input-checkbox
                          v-model="item.options.enabled"
                          switch
                          :labels="{}"
                        />
                      </td>
                      <td class="text-right align-middle">
                        <c-input-confirm
                          show-icon
                          button-class="px-2"
                          size="md"
                          @confirmed="options.navigationItems.splice(index, 1)"
                        />
                      </td>
                    </tr>

                    <component
                      :is="item.type"
                      :item="item"
                      :namespace="namespace"
                      @update="(value) => item = value"
                    />
                  </tbody>
                </b-table-simple>
              </div>
            </draggable>

            <div
              v-if="!block.options.navigationItems.length"
              class="text-center my-4"
            >
              <p>
                {{ $t('navigation.noNavigationItems') }}
              </p>
            </div>
          </c-form-table-wrapper>
        </div>
      </div>
    </b-tab>
  </div>
</template>

<script>
import base from '../base'
import Draggable from 'vuedraggable'
import { compose } from '@cortezaproject/corteza-js'
import Text from './NavTypes/Text.vue'
import Url from './NavTypes/Url.vue'
import Compose from './NavTypes/ComposePage.vue'
import Dropdown from './NavTypes/Dropdown.vue'
import { components } from '@cortezaproject/corteza-vue'
const { CInputColorPicker } = components

export default {
  i18nOptions: {
    namespaces: 'block',
  },

  components: {
    Draggable,
    TextSection: Text,
    Url,
    Compose,
    Dropdown,
    CInputColorPicker,
  },

  extends: base,

  data () {
    return {
      appearanceOptions: [
        { value: 'tabs', text: this.$t('navigation.tabs') },
        { value: 'pills', text: this.$t('navigation.pills') },
        { value: 'small', text: this.$t('navigation.small') },
      ],

      alignmentOptions: [
        { value: 'left', text: this.$t('navigation.left') },
        { value: 'center', text: this.$t('navigation.center') },
        { value: 'right', text: this.$t('navigation.right') },
      ],

      justifyOptions: [
        { value: 'justify', text: this.$t('navigation.justify') },
        { value: 'none', text: this.$t('navigation.none') },
      ],

      backgroundColors: [
        { value: 'primary', text: this.$t('navigation.primary') },
        { value: 'secondary', text: this.$t('navigation.secondary') },
        { value: 'success', text: this.$t('navigation.success') },
        { value: 'warning', text: this.$t('navigation.warning') },
        { value: 'danger', text: this.$t('navigation.danger') },
        { value: 'info', text: this.$t('navigation.info') },
      ],

      navigationItemTypes: [
        { value: 'url', text: this.$t('navigation.url') },
        { value: 'compose', text: this.$t('navigation.composePage') },
        { value: 'dropdown', text: this.$t('navigation.dropdown') },
        { value: 'text-section', text: this.$t('navigation.text') },
      ],
    }
  },

  computed: {
    themeSettings () {
      return this.$Settings.get('ui.studio.themes', [])
    },
  },

  beforeDestroy () {
    this.setDefaultValues()
  },

  methods: {
    addNavigationItem () {
      this.block.options.navigationItems.push(
        compose.PageBlockNavigation.makeNavigationItem({
          type: 'compose',
          options: {
            backgroundColor: '#FFFFFF00',
            item: {
              label: '',
              url: '',
              align: 'bottom',
              target: 'sameTab',
              displaySubPages: false,
              dropdown: {
                label: '',
                items: [],
              },
            },
          },
        }),
      )
    },

    setDefaultValues () {
      this.appearanceOptions = []
      this.alignmentOptions = []
      this.justifyOptions = []
      this.backgroundColors = []
      this.navigationItemTypes = []
    },
  },
}
</script>

<style lang="scss" scoped>
th {
  width: 25%;
}

th,
td {
  padding-left: 15px;
  padding-right: 15px;
}
</style>
