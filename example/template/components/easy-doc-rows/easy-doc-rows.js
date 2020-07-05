import { h, customElement, useHost } from "atomico";
import { useStateSize } from "@atomico/kit/use-state-size";

let style = /*css*/ `
    :host{display:grid};
    slot{display:block;flex:0%}
`;

function EasyDocRow({ columns, gap }) {
    let ref = useHost();
    columns = useStateSize(columns, ref);
    gap = useStateSize(gap, ref);
    let { current } = ref;
    let children = [...current.children].map((child, key) => {
        let slot = "slot-" + key;
        child.setAttribute("slot", slot);
        return slot;
    });

    return (
        <host shadowDom>
            <style>
                {style}
                {`:host{${columns ? `grid-template-columns:${columns};` : ""}${
                    gap ? `grid-gap:${gap};` : ""
                }}`}
            </style>
            {children.map((name) => (
                <slot name={name} />
            ))}
        </host>
    );
}

EasyDocRow.props = {
    columns: {
        type: String,
        value: "1fr 1fr 1fr, 1fr 1fr 720w, 1fr 520w",
    },
    gap: {
        type: String,
        value: "3rem",
    },
};

customElement("easy-doc-rows", EasyDocRow);
