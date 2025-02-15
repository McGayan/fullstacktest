import React, { useState } from "react";
import EntryExplorer from "./EntryExplorer";
import MainExplorer from "./MainExplorer";

function App(props) {
	const [displayContent, setDisplayContent] = useState({flag: "main",	epoch: -1, });
	const [navIndex, setNavIndex] = useState(0);

	const toggleNavIndex = (index) => {
		console.log(`HELLO TOGGLE: ${index}`);
		setNavIndex(index);
	};	
	const switchFunction = (props) => {
	console.log(`HELLO SWITCH: ${props.epoch}`);
	setDisplayContent(props);
	};

	return(
		<div id="appBackPanel">
			<div id="leftPanel">
				<div className = {"menuBack" + (navIndex===0 ? " selected":"")} onClick={()=>toggleNavIndex(0)}> Explore</div>
				<div className = {"menuBack" + (navIndex===1 ? " selected":"")} onClick={()=>toggleNavIndex(1)}> Reports</div>
			</div>
			<div id="rightPanel">
				{
					navIndex === 0 ?
					(
						displayContent.flag === "main" ? (
							<MainExplorer callbackSwitch={switchFunction} dataProvider={props.dataProvider}/>) : 
							(<EntryExplorer	callbackSwitch={switchFunction}	epoch={displayContent.epoch}/>)
					) : <></>
				}
			</div>
		</div>
	)
}

export default App