import { Component, Element, Listen, Prop, Event, EventEmitter, Method } from '@stencil/core';

import "stencil-popup";

declare var fetch;

@Component({
  tag: 'stencil-social-auth',
  styleUrl: 'stencil-social-auth.css'
})
export class StencilSocialAuth {
  @Prop() dev: boolean=false;

  @Element() el: HTMLElement;

  @Prop() provider: string;
  @Prop() config: object;

  @Event() authResponse!: EventEmitter;

  popup: any;

  configProviders: object={
    "facebook": {
      authorizationEndpoint: 'https://www.facebook.com/v3.2/dialog/oauth',
      redirectUri: window.location.origin + '/',
      responseType: 'code',
      scope: ['email'],
      scopeDelimiter: ','

    },
    "google": {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
      redirectUri: window.location.origin + '/',
      scope: ['profile', 'email'],
      scopeDelimiter: ' '
    }
  }

  new_config: object={};

  request?(url: string, config: any): Promise<any[]> | any[];
  entro: any=0;

  componentWillLoad(){
    this.new_config = Object.assign({}, this.configProviders[this.provider], this.config);
    if (!this.new_config["clientId"]){
      let error = "ERROR: 'clientId not specified in the configuration.'";
      console.error(error)
    }

    fetch = (function (fetch) {
      return function(...args) {
        if (localStorage.getItem("stencil_token") != null){
          if ("headers" in args[1]){
             args[1]["headers"].set("Authorization",'Token '+localStorage.getItem("stencil_token")+'');
          }else {
            args[1]["headers"] = new Headers();
            args[1]["headers"].set("Authorization",'Token '+localStorage.getItem("stencil_token")+'');
          }
        } 
        return fetch(...args);
      };
    })(fetch);
  }

  /**************Forma vista en proyectos*/////////////////
  /*@Prop({ connect: 'stencil-popup' }) stencilPopup: HTMLStencilPopupElement;
  async componentDidLoad(){
    const stencilPopup: HTMLStencilPopupElement = await (this.stencilPopup as any).componentOnReady();
    this.popup = stencilPopup;
  }*/
 /**************Forma propia*/////////////////
  componentDidLoad(){
    this.popup = this.el.getElementsByTagName("stencil-popup")[0];
  }

  authenticate() {
    if (!this.new_config["clientId"]){
      let error = "ERROR: 'clientId not specified in the configuration.'";
      console.error(error)
    }else{
      var params = this.dictToURI({
        client_id: this.new_config["clientId"],
        redirect_uri: this.new_config["redirectUri"],
        response_type: this.new_config["responseType"],
        scope: this.new_config["scope"].join(this.new_config["scopeDelimiter"]),
        display: "popup",
      })
      var url = this.new_config["authorizationEndpoint"] + "?" + params;
      console.log(url)
      this.popup.open(url, this.new_config["redirectUri"]);
    }
    
  }

  @Method()
  async isAuthenticated(){
    if (await localStorage.getItem("stencil_token") != null){
      return true
    }
    return false
  }

  @Method()
  async getToken(){
    return await localStorage.getItem("stencil_token");
  }

  @Method()
  async removeToken(){
    
    if (localStorage.getItem("stencil_token") != null){
      await localStorage.removeItem("stencil_token");
      return true;
    }else{
      return false;
    }
  }


  @Listen('redirectPopup')
  async redirectPopup(event: CustomEvent) {
    if (this.new_config["responseType"] == "token"){
      this.authResponse.emit({
        "authenticate": true,
        "data": event.detail
      });
    }else{
      try {
        localStorage.removeItem("stencil_token");
        const rsp = await fetch(this.new_config["backendUrl"],{
          "method": "POST",
          "body": JSON.stringify(event.detail),
          "headers": new Headers( {
            'Content-Type': 'application/json'
          })
        });
        try {
          const json = await rsp.json();
          console.log(json)
          localStorage.setItem("stencil_token", json.token)
          this.authResponse.emit({"authenticate": true});
        }
        catch(error) {
          error = "ERROR ("+rsp.status+"): "+this.new_config["backendUrl"]+" "+rsp.statusText+"";
          console.error(error)
          this.authResponse.emit({"authenticate": false, "message": error});
        }
      }
      catch(error) {
        this.authResponse.emit({"authenticate": false, "message": error});
      }
    }
    
  }

  @Listen('authResponse')
  authResponsesEvent(event: CustomEvent) {
    if (this.dev){
      console.log(event.detail)
    } 
  }

  render() {
    let renders = [
      <stencil-popup onClick={() => this.authenticate()}>
        <slot />
      </stencil-popup>
    ]

    if (this.dev){
      renders.push(<button onClick={() => this.testsApi()}>Test Api</button>);
    }

    return renders;
  }

  dictToURI(dict) {
    var str = [];
    for(var p in dict){
       str.push(encodeURIComponent(p) + "=" + encodeURIComponent(dict[p]));
    }
    return str.join("&");
  }

  async testsApi(){
    const rsp = await fetch('http://localhost:8000/users/', { 
       method: 'get'
     });
    const json = await rsp.json();
    console.log(json)
  }

}
