# README

# AT300 Blade Control Script

Welcome to the AT300 Blade Control Script! This project is designed to facilitate the control of a single **AT300** blade in AVP mode using a **Skaarhoj panel**, while also providing **basic video mixing capabilities**. Whether you're a professional in the AVP industry or a hobbyist looking to enhance your video production setup, this script aims to simplify the process of managing your AT300 blade and performing essential video mixing tasks.

## Hardware Reuqirements

Ensure you have the following hardware components:

- AT300 with at least version 2.3.358_release_stable
- Skaarhoj AirFlyProV3 or MasterKeyOne panel

## Setting up ArifloProV3

To configure the AT300 Blade Control Script for use with the Skaarhoj AirFlyProV3 panel, follow these steps:

Ensure you have installer following packages on the panel:

- system-manager
- reactor
- hardware-manager
  => In the hardware-manager package activate the listenOnPort option

(Default user credentials user: admin password: skaarhoj)

## Setting up MasterKeyOne panel

To configure the AT300 Blade Control Script for use with the MasterKeyOne panel, follow these steps:

- Install SKAARHOJ Updater on current os
- Open application click on online configuration
- install Raw Panel device core on & set up ip addresses
- enable server mode

## Dependencies

To compile and run the scripts you will need at least the following software versions:

- typescript 4.7.4
- vscript (at300 2.3.358_release_stable)
- vapi (at300 2.3.358_release_stable)
- vutil (at300 2.3.358_release_stable)

## Installation

1. Go into the "panel-config" directory and execute: `./install.sh <ip-address>`:

- The provided IP address should match your at300 machine
- The script will write this machines IP address into the package.json file for the installation of vapi vscript vutil packages
- The script installs:
  1. The latest versions of nodejs, npm
  2. typescript and n globally
  3. updates node to the latest lts version
  4. local node modules (configured in package.json)
  5. ajv to validate schema json
  6. ts-node to run the .ts files without the need to compile them first in .js files

## Configuration

The configuration for your environment is defined in the "config.json" file. You can edit the file itself and will be warned on errors while you type if your editor supports json schemas (e.g. VS Code). You can also load another configuration by setting the relative path to the configuration file as an argument on executing either the .ts scripts or the all_in_one.sh.

> Note: When you load a config file that's not in the same directory as the provided one in `video-mixer-panel/configurations/`, you have to change `$schema`-path in the config file to direct it to the `video-mixer-panel/configurations/types/schema.json` file.

Examples:

1. Using the provided file in `video-mixer-panel/configurations/config.json`:

   - Edit the config file (_not_ the `$schema` path)
   - Open a terminal in the `video-mixer-panel` directory
   - Start the scripts by calling `./start_panel.sh`

2. Using a config file in your `$HOME/Documents` directory:
   - In the config file, edit `$schema` so that it points to `<path-from-$HOME/Documents-to>video-mixer-panel/configurations/types/schema.json`.
   - Open a terminal in the `video-mixer-panel` directory
   - Execute `./start_panel.sh $HOME/Documents/MyConfigFile.json`

> Note: You can use relative and absolute paths and you can also work with links in your file system

## How to setup config.json

### Basic configuration

```
{
	"$schema": "./types/schema.json",
	"panel_ip": "YOUR_PANEL_IP_ADDRESS",
	"panel_model": "SK_AIRFLYPROV3", // Replace with 	"SK_MASTERKEYONE" if using that panel
	"panel_port": YOUR_PANEL_PORT_NUMBER,
	"machine_ip": "YOUR_MACHINE_IP_ADDRESS"
	"panel_layout":{
	...
```

Inside the config.json you have following properties: **panel_ip** , **panel_model**, **panel_port**, **machine_ip** and panel\*layout.
In the **panel_ip** you put the ip address of the Skaarhoj panel you want to use and put in the **panel_port** which the Skaarhoj panel is using (default is 9923). You need to insert the **panel_model**, currently in this script only the \*\*\_SK\*AIRFLYPROV3**\* and the **\_SK_MASTERKEYONE**\* are supported panel_models. Then you have to insert the **machine_ip** which is the ip address of an **at300\*\* **blade** which will be used to do the video mixing processing.

### Panel Layout

```
...
	"panel_layout":{
			"meLevel":[
			{
				"mixerElements":{
					...
				},
			  	"xbarElements":{
					...
				},
				"keyerElements":{
						...
			    },
			},
			{
				"mixerElements":{
					...
				},
			  	"xbarElements":{
					...
				},
				"keyerElements":{
						...
			    },
			}
		]
	}
}

```

In the panel_layout you need to populate the **meLevel** Array. Each object of the meLevel consists of **mixerElements**, **xbarElements** and **keyerElements**. Every object of the meLevel represents an me level and you can have up to many me levels you want.

### Mixer Elements

In the current application you can have at **maximum up to 4** mixer instances (which can bei either a mixer or a luma keyer) **per meLevel**.
For a mixer element you need to specify common properties **buttonIndex**, **index**, **rootMixerIndex** and **name**.
The **buttonIndex** is to map the key on which position you want it, it can be a number between 0 -3.
The **index** property is actually the mixer instance which is getting controlled if you click it on the panel.
The **rootMixerIndex** is needed to be set accordingly if you are using a luma keyer on top of another mixer (e.g. down with BGND0 and KEYER 1 KEYER2 KEYER3). Otherwise you just set the same number from **index** also in **rootMixerIndex**.
The **name** property is for the display of the button to show the name which is set in this property.

```
	...
	"mixerElements":[
		{
			"buttonIndex": 0,
			"index": 0,
			"rootMixerIndex": 0,
			"name": "BGND 0"
		},
		{
			"buttonIndex": 1,
			"index": 1,
			"rootMixerIndex": 0,
			"name": "Keyer 1"
		},
		{
			"buttonIndex": 2,
			"index": 2,
			"rootMixerIndex": 0,
			"name": "Keyer 2"
		},
		{
			"buttonIndex": 3,
			"index": 3,
			"rootMixerIndex": 0,
			"name": "Keyer 3"
		},

	]
	...
```

In this example there is a mixer instance Bgnd 0 and on top of it comes three Keyers,which all have the rootMixerIndex of the BGND mixer instance.

```
	...
	"mixerElements":[
		{
			"buttonIndex": 0,
			"index": 4,
			"rootMixerIndex": 4,
			"name": "Mixer 4"
		},
		{
			"buttonIndex": 1,
			"index": 5,
			"rootMixerIndex": 5,
			"name": "Mixer 5"
		},
		{
			"buttonIndex": 2,
			"index": 6,
			"rootMixerIndex": 6,
			"name": "Mixer 6"
		},
		{
			"buttonIndex": 3,
			"index": 7,
			"rootMixerIndex": 7,
			"name": "Mixer 7"
		},

	]
	...
```

In this example you have four seperate Mixers.

### Xbar Elements

Every **meLevel** can have their **own xbarElements**, thats why you need to specify for every meLevel the xbarElements array. You can have up to **12 different rows** of a set of one program and one preset button.

```
	...
	"xbarElements":[
		{
			"buttonIndex": 0,
			"essenceIndex": 0,
			"essenceType": "r_t_p_receiver",
			"name": "Bike"
		},
		{
			"buttonIndex": 1,
			"essenceIndex": 1,
			"essenceType": "color_correction",
			"name": "Drums"
		},
		{
			"buttonIndex": 2,
			"essenceIndex": 2,
			"essenceType": "re_play",
			"name": "Golf"
		},
	]
	...
```

For one xbarElement you need to specify common properties: **buttonIndex**, **essenceIndex**,**essenceType** and **name** .
The **buttonIndex** is used to map the key from 0-11 and the **name** is to display the name for the given source.
With **essenceType** and **essenceIndex** you specify which video essence type you want to map on the xbar element as program & preset,

Current **essenceTypes** are supported:

- video_mixer
- r_t_p_receiver
- re_play (delay_player)
- color_correction
- video_signal_generator

### KeyerElements

Currently keyerElements is not used and shall be empty.

```
	...
	"keyerElements":[]
	...
```

## Execution

To execute the scripts in the`video-mixer-panel` directory and enter `bash start_panel.sh <path-to-custom-config-json>` in the terminal.
