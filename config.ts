type Config = {
	api: { port: number };
	mysql: { port: number };
};

export const config: Config =
	process.env.NODE_ENV === "production"
		? {
				mysql: { port: 3306 },
				api: { port: 3626 },
		  }
		: {
				mysql: { port: 3307 },
				api: { port: 8080 },
		  };
