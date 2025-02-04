import React, { useState } from "react";
import EntryExplorer from "./EntryExplorer";
import MainExplorer from "./MainExplorer";

function App(props) {
	const [displayContent, setDisplayContent] = useState({flag: "main",	epoch: -1, });
	
	  const switchFunction = (props) => {
		console.log(`HELLO SWITCH: ${props.epoch}`);
		setDisplayContent(props);
	  };

	return(
		<div>
			{displayContent.flag === "main" ? (
				<MainExplorer callbackSwitch={switchFunction} dataProvider={props.dataProvider}/>
			) : (
				<EntryExplorer	callbackSwitch={switchFunction}	epoch={displayContent.epoch}/>
			)}
		</div>
	)
}

export default App