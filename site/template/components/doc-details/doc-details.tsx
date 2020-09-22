import { h, Props, c } from "atomico";

function docDetails({ summary }: Props<typeof docDetails.props>) {
    return (
        <host shadowDom>
            <details>
                <summary>{summary}</summary>
                <slot></slot>
            </details>
        </host>
    );
}

docDetails.props = {
    summary: {
        type: String,
    },
};

customElements.define("doc-details", c(docDetails));
