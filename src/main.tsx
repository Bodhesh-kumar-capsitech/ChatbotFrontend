import { render } from "preact";
import App from "./components/App";
import "./Widget";

render(<App />, document.getElementById("app") as HTMLElement);
