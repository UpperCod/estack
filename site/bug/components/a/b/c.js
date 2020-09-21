import { c } from "atomico";
import html from "atomico/html";
import style from "./c.css";

function button() {
    return html`<host>
        <style>
            ${style}
        </style>
    </host>`;
}

customElements.define("spectrum-button", c(button));
