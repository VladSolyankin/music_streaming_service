import React from 'react';
import '../../css/Sidemenu.css'

const SelectedPlaylist = ({isVisible}) => {
	return (
		<div className="wrapper">
			<div className={isVisible ? "menu__closed" : "menu__opened"}>

			</div>
		</div>
	);
};

export default SelectedPlaylist;