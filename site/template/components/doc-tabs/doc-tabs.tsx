import { h, Component, c, useHost, useProp, Props } from "atomico";
import style from "./doc-tabs.css";

const staticStyle = <style>{style}</style>;

function docTab({ tabs, msAnimation, autoHeight }: Props<typeof docTab.props>) {
    const [tab, setTab] = useProp("tab");
    const host = useHost();
    const { current } = host;
    const tabsList = tabs.split(/ *, */);

    const heights = [...current.children].map((child: HTMLElement, index) => {
        if (child.slot != tabsList[index]) {
            child.slot = tabsList[index];
        }
        child.style.margin = "0px";
        return child.clientHeight + "px";
    });

    return (
        <host items={tabsList} shadowDom>
            {staticStyle}
            <header class="header">
                <div class="buttons">
                    {tabsList.map((title, index) => (
                        <button
                            class={
                                "button " +
                                (index == tab
                                    ? "button-active"
                                    : index == tab - 1
                                    ? "button-prev"
                                    : index == tab + 1
                                    ? "button-next"
                                    : "")
                            }
                            onclick={() => setTab(index)}
                        >
                            {title}
                            <div class="button_line"></div>
                        </button>
                    ))}
                    <div class="buttons_line"></div>
                </div>
            </header>
            <div class="mask">
                <div
                    class="slides"
                    style={`transition:${msAnimation} ease all;transform:translateX(${
                        -100 * tab
                    }%);height:${autoHeight ? heights[tab] : "100%"}`}
                >
                    {tabsList.map((title) => (
                        <div class="slide">
                            <slot name={title}></slot>
                        </div>
                    ))}
                </div>
            </div>
        </host>
    );
}

docTab.props = {
    items: Array,
    tabs: String,
    tab: {
        type: Number,
        value: 0,
    },
    msAnimation: {
        type: String,
        value: ".35s",
    },
    autoHeight: { type: Boolean, reflect: true },
};

customElements.define("doc-tabs", c(docTab));
