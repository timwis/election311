var dict = dict || {};
dict = {
	lookup: function(section, key, lang) {
		if(dict[section] !== undefined && dict[section][key] !== undefined && dict[section][key][lang] !== undefined)
			return dict[section][key][lang];
		else
			return "";
	}
	,footer: {
		info: {
			en: "Info"
			,es: "Info"
		}
		,where: {
			en: "Where to Vote"
			,es: "Donde Votar"
		}
		,candidates: {
			en: "Candidates"
			,es: "Candidatos"
		}
	}
	,info: {
		title: {
			en: "Election Info"
			,es: "Informaci&oacute;n Electoral"
		}
		,intro: {
			en: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vehicula tempor urna, venenatis euismod enim euismod sed."
			,es: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vehicula tempor urna, venenatis euismod enim euismod sed."
		}
		,when: {
			en: "You can vote from <strong>7am - 8pm</strong>"
			,es: "Usted puede votar de <strong>7am - 8pm</strong>"
		}
		,voteridTitle: {
			en: "Voter ID"
			,es: "Voter ID"
		}
		,voteridContent: {
			en: "Nunc mi leo, dapibus a vehicula non, consectetur eget nisl. Vestibulum ligula eros, dictum molestie feugiat eu, porta quis mauris. Sed varius quam vel nisi luctus commodo."
			,es: "Nunc mi leo, dapibus a vehicula non, consectetur eget nisl. Vestibulum ligula eros, dictum molestie feugiat eu, porta quis mauris. Sed varius quam vel nisi luctus commodo."
		}
	}
	,search: {
		prompt: {
			en: "Enter the address where you are registered to vote"
			,es: "Escriba el direcci&oacute;n donde usted est&aacute; registrado"
		}
		,address: {
			en: "Address"
			,es: "Direcci&oacute;n"
		}
		,search: {
			en: "Search"
			,es: "Buscar"
		}
	}
	,pollingplace: {
		title: {
			en: "Where to Vote"
			,es: "Donde Votar"
		}
		,yourAddress: {
			en: "Your Address"
			,es: "Su direcci&oacute;n"
		}
		,voteAt: {
			en: "Vote At"
			,es: "Vota a"
		}
		,changeAddress: {
			en: "Change Address"
			,es: "Cambiar Direcci&oacute;n"
		}
	}
	,candidates: {
	}
}