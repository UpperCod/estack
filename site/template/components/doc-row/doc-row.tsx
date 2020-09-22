import { h, c, useHost, Props } from "atomico";
import { useStateSize } from "../../hooks/use-state-size/use-state-size";

function docRow({ col, gap: _gap }: Props<typeof docRow.props>) {
    const host = useHost();
    const gridTemplateColumns = useStateSize(col, host);
    const gap = useStateSize(_gap, host);
    return <host style={{ display: "grid", gridTemplateColumns, gap }}></host>;
}

docRow.props = {
    col: {
        type: String,
        value: "1fr 1fr",
    },
    gap: {
        type: String,
        value: "3rem, 2rem 720w, 1rem 520w",
    },
};

customElements.define("doc-row", c(docRow));
