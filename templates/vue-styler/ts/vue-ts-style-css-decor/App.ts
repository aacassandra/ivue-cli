import { Component, Prop, Vue } from "vue-property-decorator";
@Component
export default class App extends Vue {
  constructor() {
    super();
    this.init();
  }

  async init() {
    document.addEventListener(
      "deviceready",
      async () => {
        let OPT = {
          DB_NAME: "iVuex",
          DRIVER: "sqlite" //available => indexeddb,localstorage,sessionstorage,websql,sqlite
        };
        await this.ionic.plugin.configs.storage.setConfigs(OPT);
        let dvc = await this.ionic.plugin.device.cordova;
        console.log(dvc);
        this.ionic.plugin.splashscreen.hide();
      },
      false
    );
  }
}
