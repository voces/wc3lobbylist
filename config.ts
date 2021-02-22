type Config = {
	api: { port: number };
	mysql: { port: number };
	revo: { channel: string };
};

export const config: Config =
	process.env.NODE_ENV === "production"
		? {
				mysql: { port: 3306 },
				api: { port: 3626 },
				revo: { channel: "438364047176630272" },
		  }
		: {
				mysql: { port: 3307 },
				api: { port: 8080 },
				revo: { channel: "457570641638326274" },
		  };
