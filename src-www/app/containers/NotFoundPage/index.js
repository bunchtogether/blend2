// @flow

import * as React from 'react';
import Helmet from 'react-helmet';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import { compose, bindActionCreators } from 'redux';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import Content from '../../components/Content';
import { navigateStream } from '../App/actions';
import getColor from '../../lib/colors';

const styles = (theme:Object) => ({ // eslint-disable-line no-unused-vars
  paper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      position: 'absolute',
      top: theme.spacing(2),
      left: theme.spacing(2),
      right: theme.spacing(2),
      bottom: theme.spacing(2),
    },
    textAlign: 'center',
  },
  button: {
    marginTop: '20px',
  },
  splash: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 240,
    lineHeight: '240px',
    fontWeight: 300,
    [theme.breakpoints.down('sm')]: {
      fontSize: 140,
      lineHeight: '160px',
    },
  },
  title: {
    marginBottom: '30px',
  },
  body1: {
    maxWidth: '32em',
  },
});


type Props = {
  classes: ClassesType,
  navigateStream: Function,
};

export class NotFoundPage extends React.PureComponent<Props> { // eslint-disable-line react/prefer-stateless-function
  render() {
    const { classes } = this.props;
    return (
      <React.Fragment>
        <Helmet>
          <title>Bolt 🔩 404, Resource Not Round</title>
        </Helmet>
        <Header showSearch={false} />
        <Navigation />
        <Content>
          <Paper elevation={1} className={classes.paper}>
            <div className={classes.splash}>
              <span style={{ color: getColor('404', 0) }}>4</span>
              <span style={{ color: getColor('404', 1) }}>0</span>
              <span style={{ color: getColor('404', 2) }}>4</span>
            </div>
            <Typography gutterBottom variant="h4" className={classes.title}>The page you requested does not exist.</Typography>
            <Typography gutterBottom variant="subtitle1" className={classes.body1}>If you clicked on a link, the link may be broken. If you entered a web address, please check that it was entered correctly.</Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={this.props.navigateStream}
              className={classes.button}
            >
              Return Home
            </Button>
          </Paper>
        </Content>
      </React.Fragment>
    );
  }
}

const withConnect = connect(
  null,
  (dispatch: Function): Object => bindActionCreators({ navigateStream }, dispatch),
);

export default compose(
  withStyles(styles),
  withConnect,
)(NotFoundPage);
